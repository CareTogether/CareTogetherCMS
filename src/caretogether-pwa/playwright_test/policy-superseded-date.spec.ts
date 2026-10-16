import { expect, test } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import type {} from './policy-superseded-date-harness';

test.use({ storageState: { cookies: [], origins: [] } });
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    input: fileURLToPath(
      new URL('./policy-superseded-date-harness.tsx', import.meta.url)
    ),
    platform: 'browser',
    tsconfig: false,
    write: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    },
    output: { format: 'iife', name: 'PolicyDateHarness' },
  });
  const chunk = result.output.find((item) => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('Missing policy bundle');
  bundle = chunk.code;
});
test.beforeEach(async ({ page }) => {
  await page.route('**/policy-date-harness*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body><div id="root"></div></body></html>',
    })
  );
});

for (const timezoneId of ['America/Los_Angeles', 'UTC', 'Pacific/Auckland']) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    for (const kind of [
      'arrangement',
      'individual',
      'family',
      'organization',
    ]) {
      test(`${kind}: selects, serializes, reloads, edits and clears a date`, async ({
        page,
      }) => {
        await page.goto(`/policy-date-harness?kind=${kind}&new`);
        await page.addScriptTag({ content: bundle });
        if (kind === 'arrangement') {
          await page
            .getByRole('textbox', { name: 'Arrangement Type', exact: true })
            .fill('Care');
        } else {
          await page
            .getByRole('textbox', { name: /Role Type$/ })
            .fill('Helper');
          await page
            .getByRole('textbox', { name: 'Version', exact: true })
            .fill('v1');
        }
        await expect(page.getByLabel('Superseded display')).toHaveText(
          'Current'
        );
        await page
          .getByRole('switch', { name: 'Superseded', exact: true })
          .check();
        const input = page.getByLabel('Superseded Date', { exact: true });
        await expect(input).toHaveAttribute('type', 'date');
        await input.fill('2026-01-02');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(input).toHaveValue('2026-01-02');
        await expect(page.getByLabel('Superseded display')).toHaveText(
          '01/02/26'
        );
        expect(
          await page.evaluate(
            () =>
              JSON.parse(localStorage.getItem('saved-policy')!).supersededAtUtc
          )
        ).toBe('2026-01-02T00:00:00.000Z');
        await page.reload();
        await page.addScriptTag({ content: bundle });
        await expect(input).toHaveValue('2026-01-02');
        await input.fill('2026-07-15');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(page.getByLabel('Superseded display')).toHaveText(
          '07/15/26'
        );
        await input.fill('');
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(input).toHaveCount(0);
        await expect(page.getByLabel('Superseded display')).toHaveText(
          'Current'
        );
      });
      test(`${kind}: historical timestamps use their UTC calendar date`, async ({
        page,
      }) => {
        await page.goto(`/policy-date-harness?kind=${kind}&historical`);
        await page.addScriptTag({ content: bundle });
        await expect(
          page.getByLabel('Superseded Date', { exact: true })
        ).toHaveValue('2026-01-02');
        await expect(page.getByLabel('Superseded display')).toHaveText(
          '01/02/26'
        );
      });
    }
  });
}
