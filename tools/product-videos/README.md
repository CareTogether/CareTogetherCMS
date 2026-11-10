# Product videos and screenshots

Records short narrated videos and screenshots of CareTogether against the Atlantis test organization on app.caretogether.io. A scripted browser clicks through the app with a visible cursor and highlight ring. A local text-to-speech model reads the narration, and ffmpeg joins the two into an MP4.

The same scripts serve two processes:

- [Launching a feature](../../docs/feature-launch.md): an Update post with videos.
- [Writing help articles](../../docs/help-articles.md): screenshots, and sometimes a video.

Each subject gets a topic folder. `family-screen-v2/` is a complete example.

## Setup (once per machine)

You need Node with the PWA's dependencies installed (`npm ci` in `src/caretogether-pwa`), Chromium, ffmpeg, and [uv](https://docs.astral.sh/uv/).

```bash
cd tools/product-videos
uv venv --python 3.11 .venv
uv pip install --python .venv/bin/python -r requirements.txt
mkdir -p models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
node record.mjs login
```

`login` opens a browser window. Sign in yourself, with an account that can see Atlantis; the session is saved in `.profile/`. Run it again when recordings stop at the sign-in page. Agents never type passwords.

Chromium is expected at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to use another one.

`.venv/`, `models/`, `.profile/`, `work/` and MP4 files are ignored by git.

## A topic's files

```
<topic>/
  topic.json           name, and the PostHog flags to force on while recording
  videos/<video>.mjs   steps: what the browser does
  videos/<video>.json  narration: voice, speed, and one text per step id (videos only)
  assets/              files a video uploads
  setup/               scripts that put Atlantis data into the state a video needs
  thumbnail.html       a launch's featured image, 1600 × 800 (launches only)
  youtube.md           titles and descriptions for the uploads (videos only)
```

Name a topic after the subject, in kebab case: `family-screen-v2`, `complete-requirements`.

A video module exports:

- `output`: the MP4 file name, written to `work/<topic>/`.
- `startUrl`: the path after the Atlantis organization URL.
- `ready(page)`: waits for, or prepares, the starting state.
- `steps({ page, dryRun, h, baseUrl })`: returns one async function per step. `h` has `click`, `moveTo`, `highlight`, `highlightArea`, `typeSlowly`, `screenshot`, `sleep` and `resetOverlay`.

For a video, the step ids in the `.mjs` and the `.json` must match, in the same order. Each step starts its narration clip and its actions together, then waits until the clip ends plus a short pause. A `.mjs` used only for screenshots needs no `.json`.

Copy a video from `family-screen-v2/videos/` as a starting point.

## Before recording

- Record only in Atlantis. Never use a real organization's data.
- Find families that show the subject well, and note their URLs.
- Put the data into the state each script needs: a draft note to approve, a missing requirement, an exemption to show. Save those steps as `setup/` scripts, so a retake can reset them.
- Atlantis is sometimes reset, and data from earlier recordings may be gone or in the way. Check each family first.

## Making a video

```bash
node record.mjs probe <topic> /families/<id> [script.mjs]   # find locators: saves work/probe.png, prints the accessibility tree
node record.mjs record <topic>/<video> --dry                # check the steps without saving anything in Atlantis
.venv/bin/python tts.py <topic>/<video>                     # narration clips and their lengths
node record.mjs record <topic>/<video>                      # the real take, timed to the clips
.venv/bin/python build.py <topic>/<video>                   # work/<topic>/<output>.mp4
```

Run `tts.py` before the real take, so each step waits for its clip's real length. If a step fails, the recorder saves `work/<topic>/<video>/error.png` and prints the page's accessibility tree.

A real take changes Atlantis data: it saves notes, completes requirements, uploads files. Use `--dry` while you work on the steps, and run the topic's `setup/` scripts with `probe` to reset the data before a retake.

Narrate with Kokoro's `af_heart` voice, so all our videos sound alike. We tried other Kokoro voices, Chatterbox and Qwen3-TTS for Family Screen V2, and chose `af_heart` for its clear, natural delivery that runs fast on a laptop.

Things that went wrong with Family Screen V2:

- A quick filter remembered in localStorage hid a newly uploaded file. Clear remembered filters in `ready()`.
- Seed documents in Atlantis have no stored file, so their preview fails. Upload a new file in the video instead.
- Some actions need a second confirmation dialog, such as **Mark requirement incomplete?**.
- A side panel can still show the old state after a save. Close it before showing the result.
- Atlantis seed dates move when the organization is reset. Match dates with a pattern, such as `/^Opened \d/`, never a literal like `'Opened 9/1/26'`.

## Making screenshots

Call `h.screenshot(name, locators)` in a step. It saves `work/<topic>/screenshots/<name>.png` without the cursor, and with the highlight ring around the locators if you pass any.

```js
await h.screenshot('approvals-tab', [page.getByRole('tab', { name: /Approvals/i })]);
```

Screenshots are taken only by the `stills` mode, which runs the steps without recording video or waiting for narration:

```bash
node record.mjs stills <topic>/<video> --dry
```

`record` skips `h.screenshot`, so a still never shows up in a video. A topic can then share one script between its video and its help article's images. Drop `--dry` when a screenshot needs to show the result of a save.

## Checking the output

Before uploading a video, look at frames from the whole video, not only the first seconds:

```bash
ffmpeg -i work/<topic>/<output>.mp4 -vf "fps=1/4,scale=480:-1,tile=4x4" -frames:v 1 work/<topic>/contact-sheet.png
```

Check that each highlight lands on what the narration names, that no loading spinner or error shows, and that the app's teal looks teal. `build.py` converts the colors so players don't show it as cyan.

Open every screenshot too. Check it shows only Atlantis test data, with no real names, and that nothing is cut off.

## Thumbnail

Put a real screenshot from Atlantis next to `thumbnail.html`, as in the example, then render it:

```bash
chromium --headless --hide-scrollbars --window-size=1600,800 --screenshot=work/<topic>/thumbnail.png <topic>/thumbnail.html
```
