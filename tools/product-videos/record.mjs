// Records narrated product videos and screenshots against the Atlantis test organization on app.caretogether.io.
// See README.md for setup and use.
//
//   node record.mjs login                                    opens a browser window so you can sign in once
//   node record.mjs record <topic>/<video>                   records work/<topic>/<video>/frames and timeline.json
//   node record.mjs record <topic>/<video> --dry             same walkthrough, but cancels instead of saving
//   node record.mjs stills <topic>/<video> [--dry]           runs the steps without video, saving work/<topic>/screenshots
//   node record.mjs probe <topic> <path> [script.mjs]        opens a page, runs a script, saves work/probe.png
//
// Each topic lives in <topic>/, with topic.json (feature flags to force on)
// and one videos/<video>.mjs (steps) plus videos/<video>.json (narration) per video.
// A videos/<video>.mjs without narration is fine for stills only.
// Each step starts its narration clip and performs its actions at the same time,
// then waits until the clip has finished plus a short pause.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.resolve(ROOT, '../../src/caretogether-pwa/package.json')
);
const { chromium } = require('playwright');

const BASE_URL =
  'https://app.caretogether.io/org/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222';
const PROFILE_DIR = path.join(ROOT, '.profile');
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const VIEWPORT = { width: 1920, height: 1080 };
const PAUSE_AFTER_CLIP_MS = 600;
const mode = process.argv[2];
const [topicName, videoId] = (process.argv[3] ?? '').split('/');
const TOPIC_DIR = path.join(ROOT, topicName ?? '');
const WORK_DIR = path.join(ROOT, 'work', topicName ?? '', videoId ?? '');
const FRAMES_DIR = path.join(WORK_DIR, 'frames');
const SCREENSHOTS_DIR = path.join(ROOT, 'work', topicName ?? '', 'screenshots');
const dryRun = process.argv.includes('--dry');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadTopic() {
  const file = path.join(TOPIC_DIR, 'topic.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function loadClipDurations() {
  const narration = JSON.parse(
    fs.readFileSync(path.join(TOPIC_DIR, 'videos', `${videoId}.json`), 'utf8')
  );
  const durationsFile = path.join(WORK_DIR, 'audio/durations.json');
  const durations = fs.existsSync(durationsFile)
    ? JSON.parse(fs.readFileSync(durationsFile, 'utf8'))
    : {};

  // Without TTS output yet, estimate about 2.6 words per second.
  return Object.fromEntries(
    narration.steps.map((step) => [
      step.id,
      durations[step.id] ?? step.text.split(/\s+/).length / 2.6,
    ])
  );
}

async function launchBrowser(headless) {
  return chromium.launchPersistentContext(PROFILE_DIR, {
    executablePath: CHROMIUM_PATH,
    headless,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
}

async function login() {
  const context = await launchBrowser(false);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(BASE_URL);
  console.log('Sign in in the browser window. Waiting for the app to load...');
  await page
    .getByRole('button', { name: 'user account' })
    .waitFor({ timeout: 60 * 60_000 });
  console.log('Signed in. Session saved in .profile/.');
  await context.close();
}

// Fake cursor and highlight ring, drawn above the app.
function installOverlay() {
  const install = () => {
    if (document.getElementById('__demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = '__demo-cursor';
    cursor.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 2 L4 23 L9.5 17.5 L13.5 26 L17 24.5 L13 16 L21 16 Z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
      transform: 'translate(960px, 540px)',
      transition: 'transform 0ms',
    });
    const ripple = document.createElement('div');
    ripple.id = '__demo-ripple';
    Object.assign(ripple.style, {
      position: 'fixed',
      width: '36px',
      height: '36px',
      marginLeft: '-18px',
      marginTop: '-18px',
      borderRadius: '50%',
      background: 'rgba(0, 131, 143, 0.35)',
      zIndex: '2147483646',
      pointerEvents: 'none',
      opacity: '0',
      transform: 'scale(0.3)',
      transition: 'opacity 350ms ease-out, transform 350ms ease-out',
    });
    const ring = document.createElement('div');
    ring.id = '__demo-ring';
    Object.assign(ring.style, {
      position: 'fixed',
      border: '3px solid #f9a825',
      borderRadius: '10px',
      boxShadow: '0 0 0 4px rgba(249, 168, 37, 0.25)',
      zIndex: '2147483645',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 250ms ease-in-out',
    });
    document.body.append(ring, ripple, cursor);
  };
  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install);
}

async function center(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error(`No bounding box for ${locator}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

let cursorPosition = { x: 960, y: 540 };

async function moveTo(page, locator) {
  const { x, y } = await center(locator);
  const distance = Math.hypot(x - cursorPosition.x, y - cursorPosition.y);
  const duration = Math.round(Math.min(900, Math.max(350, distance * 0.6)));
  await page.evaluate(
    ([x, y, duration]) => {
      const cursor = document.getElementById('__demo-cursor');
      cursor.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      cursor.style.transform = `translate(${x - 4}px, ${y - 2}px)`;
    },
    [x, y, duration]
  );
  await page.mouse.move(x, y);
  cursorPosition = { x, y };
  await sleep(duration + 150);
}

async function click(page, locator) {
  await moveTo(page, locator);
  await page.evaluate(([x, y]) => {
    const ripple = document.getElementById('__demo-ripple');
    ripple.style.transition = 'none';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.opacity = '1';
    ripple.style.transform = 'scale(0.3)';
    ripple.getBoundingClientRect();
    ripple.style.transition = 'opacity 350ms ease-out, transform 350ms ease-out';
    ripple.style.opacity = '0';
    ripple.style.transform = 'scale(1.4)';
  }, [cursorPosition.x, cursorPosition.y]);
  await locator.click();
  await sleep(250);
}

async function highlight(page, locator, ms = 1800) {
  const { box } = await center(locator);
  await showRing(page, box.x, box.y, box.width, box.height, ms);
}

async function placeRing(page, x, y, width, height) {
  await page.evaluate(
    ([x, y, width, height]) => {
      const ring = document.getElementById('__demo-ring');
      Object.assign(ring.style, {
        left: `${x - 6}px`,
        top: `${y - 6}px`,
        width: `${width + 12}px`,
        height: `${height + 12}px`,
        opacity: '1',
      });
    },
    [x, y, width, height]
  );
}

async function hideRing(page) {
  await page.evaluate(() => {
    document.getElementById('__demo-ring').style.opacity = '0';
  });
}

async function showRing(page, x, y, width, height, ms) {
  await placeRing(page, x, y, width, height);
  await sleep(ms);
  await hideRing(page);
}

async function areaAround(locators) {
  const boxes = [];
  for (const locator of locators) boxes.push((await center(locator)).box);
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

async function highlightArea(page, locators, ms = 1800) {
  const { x, y, width, height } = await areaAround(locators);
  await showRing(page, x, y, width, height, ms);
}

// In stills mode, saves work/<topic>/screenshots/<name>.png without the cursor,
// with the highlight ring around the given locators if there are any.
// In record mode it does nothing, so a still never shows up in the video.
async function screenshot(page, name, locators = []) {
  if (mode !== 'stills') return;
  await page.evaluate(() => {
    document.getElementById('__demo-cursor').style.visibility = 'hidden';
  });
  if (locators.length > 0) {
    const { x, y, width, height } = await areaAround(locators);
    await placeRing(page, x, y, width, height);
  }
  await sleep(400);
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`) });
  await hideRing(page);
  await page.evaluate(() => {
    document.getElementById('__demo-cursor').style.visibility = 'visible';
  });
  console.log(`saved screenshots/${name}.png`);
}

async function resetOverlay(page) {
  await page.evaluate(installOverlay);
  await page.evaluate(([x, y]) => {
    document.getElementById('__demo-cursor').style.transform = `translate(${x - 4}px, ${y - 2}px)`;
  }, [cursorPosition.x, cursorPosition.y]);
}

async function typeSlowly(page, text) {
  for (const character of text) {
    await page.keyboard.type(character);
    await sleep(character === ' ' ? 45 : 28);
  }
}

async function startScreencast(page) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  const session = await page.context().newCDPSession(page);
  const frames = [];
  session.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = `${String(frames.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(FRAMES_DIR, file), Buffer.from(data, 'base64'));
    frames.push({ file, timestamp: metadata.timestamp });
    await session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await session.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
    everyNthFrame: 1,
  });
  return {
    frames,
    stop: () => session.send('Page.stopScreencast'),
  };
}

// Turns the topic's feature flags on in this browser only, by patching PostHog's
// flag response. The signed-in account's own Beta Features settings stay as they are.
async function forceFlags(context) {
  const flagKeys = loadTopic().flags ?? [];
  if (flagKeys.length === 0) return;
  await context.route('https://us.i.posthog.com/flags/**', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    for (const flagKey of flagKeys) {
      body.featureFlags = { ...body.featureFlags, [flagKey]: true };
      if (body.flags) {
        body.flags[flagKey] = {
          ...body.flags[flagKey],
          key: flagKey,
          enabled: true,
          variant: null,
        };
      }
    }
    await route.fulfill({ response, json: body });
  });
}

async function openVideo() {
  const video = await import(path.join(TOPIC_DIR, 'videos', `${videoId}.mjs`));
  const context = await launchBrowser(true);
  await forceFlags(context);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.addInitScript(installOverlay);
  await page.goto(BASE_URL + video.startUrl);
  await page.getByRole('button', { name: 'user account' }).waitFor({ timeout: 90_000 });
  await video.ready(page);
  await page.evaluate(installOverlay);
  await sleep(2000);

  const h = {
    sleep,
    moveTo: (locator) => moveTo(page, locator),
    click: (locator) => click(page, locator),
    highlight: (locator, ms) => highlight(page, locator, ms),
    highlightArea: (locators, ms) => highlightArea(page, locators, ms),
    resetOverlay: () => resetOverlay(page),
    typeSlowly: (text) => typeSlowly(page, text),
    screenshot: (name, locators) => screenshot(page, name, locators),
  };
  const actions = video.steps({ page, dryRun, h, baseUrl: BASE_URL });
  return { context, page, actions };
}

async function runStep(context, page, actions, id) {
  try {
    await actions[id]();
  } catch (error) {
    fs.mkdirSync(WORK_DIR, { recursive: true });
    await page.screenshot({ path: path.join(WORK_DIR, 'error.png') });
    console.log(await page.locator('body').ariaSnapshot().catch(() => ''));
    await context.close();
    throw error;
  }
}

// Runs every step without recording video or waiting for narration, so only
// the steps' h.screenshot calls produce output. No narration file is needed.
async function stills() {
  const { context, page, actions } = await openVideo();
  for (const id of Object.keys(actions)) {
    console.log(`step ${id}`);
    await runStep(context, page, actions, id);
    await sleep(PAUSE_AFTER_CLIP_MS);
  }
  await context.close();
}

async function record() {
  const clipDurations = loadClipDurations();
  const { context, page, actions } = await openVideo();

  const screencast = await startScreencast(page);
  await sleep(1200);

  const timeline = [];
  for (const [id, clipSeconds] of Object.entries(clipDurations)) {
    const startedAt = Date.now() / 1000;
    timeline.push({ id, start: startedAt });
    console.log(`step ${id} (${clipSeconds.toFixed(1)}s clip)`);
    await runStep(context, page, actions, id);
    const elapsedMs = Date.now() - startedAt * 1000;
    await sleep(Math.max(0, clipSeconds * 1000 - elapsedMs) + PAUSE_AFTER_CLIP_MS);
  }

  await page.keyboard.press('Escape');
  await sleep(1500);
  const end = Date.now() / 1000;
  await screencast.stop();
  await context.close();

  fs.writeFileSync(
    path.join(WORK_DIR, 'timeline.json'),
    JSON.stringify({ frames: screencast.frames, steps: timeline, end }, null, 2)
  );
  console.log(`Captured ${screencast.frames.length} frames.`);
}

// Opens BASE_URL + <path> with the topic's flags on, runs the optional script's
// default export on the page, then saves work/probe.png and prints the page's
// accessibility tree. Use it to find locators and to run a topic's setup/ scripts.
async function probe(urlPath, scriptFile) {
  const context = await launchBrowser(true);
  await forceFlags(context);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(BASE_URL + urlPath);
  await page.getByRole('button', { name: 'user account' }).waitFor({ timeout: 90_000 });
  await sleep(2500);
  try {
    if (scriptFile) {
      const script = await import(path.resolve(scriptFile) + `?t=${Date.now()}`);
      await script.default(page);
      await sleep(1000);
    }
  } finally {
    fs.mkdirSync(path.join(ROOT, 'work'), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, 'work/probe.png') });
    console.log(await page.locator('body').ariaSnapshot());
    await context.close();
  }
}

if (mode === 'login') await login();
else if (mode === 'record' && videoId) await record();
else if (mode === 'stills' && videoId) await stills();
else if (mode === 'probe' && topicName) await probe(process.argv[4] ?? '', process.argv[5]);
else
  console.log(
    'Usage: node record.mjs login | record <topic>/<video> [--dry] | stills <topic>/<video> [--dry] | probe <topic> <path> [script.mjs]'
  );
