import { expect, test } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import type {} from './header-fullscreen-harness';

test.use({ storageState: { cookies: [], origins: [] } });
let bundle: string;
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    ShellSearchBar: 'export const ShellSearchBar = () => null;',
    ShellContextSwitcher: 'export const ShellContextSwitcher = () => null;',
    EarlyAccessFeaturesDialog:
      'export const EarlyAccessFeaturesDialog = () => null;',
    'Authentication/Auth': 'export const logoutAsync = async () => {};',
    'Hooks/useScopedTrace': 'export const useScopedTrace = () => () => {};',
    'posthog-js/react': 'export const useFeatureFlagEnabled = () => true;',
  };
  const result = await build({
    input: fileURLToPath(
      new URL('./header-fullscreen-harness.tsx', import.meta.url)
    ),
    platform: 'browser',
    tsconfig: false,
    write: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'import.meta.env.MODE': JSON.stringify('production'),
      },
    },
    plugins: [
      {
        name: 'header-context',
        resolveId(source) {
          const key = Object.keys(mocks).find((key) => source.endsWith(key));
          return key ? `\0mock:${key}` : null;
        },
        load(id) {
          return id.startsWith('\0mock:') ? mocks[id.slice(6)] : null;
        },
      },
    ],
    output: { format: 'iife' },
  });
  const chunk = result.output.find((item) => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('Missing header bundle');
  bundle = chunk.code;
});

test.beforeEach(async ({ page }) => {
  await page.route('**/header-fullscreen-harness', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body><div id="root"></div></body></html>',
    })
  );
});

async function mount(page: import('@playwright/test').Page) {
  await page.goto('/header-fullscreen-harness');
  await page.addScriptTag({ content: bundle });
}

test('enters and exits real browser fullscreen with matching icons and labels', async ({
  page,
}) => {
  await mount(page);
  expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(
    true
  );
  const enter = page.getByRole('button', {
    name: 'Enter fullscreen',
    exact: true,
  });
  await expect(enter.locator('svg')).toBeVisible();
  const enterPath = await enter.locator('svg path').getAttribute('d');
  await enter.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Enter fullscreen');
  await enter.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.fullscreenElement === document.documentElement
      )
    )
    .toBe(true);
  const exit = page.getByRole('button', {
    name: 'Exit fullscreen',
    exact: true,
  });
  await expect(exit.locator('svg')).toBeVisible();
  expect(await exit.locator('svg path').getAttribute('d')).not.toBe(enterPath);
  await exit.click();
  await expect(enter).toBeVisible();
  expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(
    true
  );
});

test('synchronizes when fullscreen is exited outside the toggle', async ({
  page,
}) => {
  await mount(page);
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen' })
  ).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await expect(
    page.getByRole('button', { name: 'Enter fullscreen' })
  ).toBeVisible();
});

test('unsupported fullscreen hides the toggle while the real profile menu still works', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(document, 'fullscreenEnabled', { value: false })
  );
  await mount(page);
  await expect(page.getByRole('button', { name: /fullscreen/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'user account' }).click();
  await expect(
    page.getByRole('menuitem', { name: 'Beta Features' })
  ).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
});

test('rejected requests show an error and leave the toggle usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error('Denied'));
  });
  await mount(page);
  const enter = page.getByRole('button', { name: 'Enter fullscreen' });
  await enter.click();
  await expect(page.getByRole('alert')).toContainText(
    'Unable to change fullscreen mode.'
  );
  await expect(enter).toBeEnabled();
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
});
