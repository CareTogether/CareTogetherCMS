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

for (const [kind, timezoneId] of [
  ['arrangement', 'America/Sao_Paulo'],
  ['individual', 'America/New_York'],
  ['family', 'Asia/Tokyo'],
  ['organization', 'UTC'],
]) {
  test.describe(`${kind} in ${timezoneId}`, () => {
    test.use({ timezoneId });
    test('MUI calendar selection, UTC save/reload, invalid input and clearing', async ({
      page,
    }) => {
      await page.goto(`/policy-date-harness?kind=${kind}&historical`);
      await page.addScriptTag({ content: bundle });
      const picker = page.getByRole('group', {
        name: 'Superseded Date',
        exact: true,
      });
      const month = picker.getByRole('spinbutton', {
        name: 'Month',
        exact: true,
      });
      const day = picker.getByRole('spinbutton', { name: 'Day', exact: true });
      const year = picker.getByRole('spinbutton', {
        name: 'Year',
        exact: true,
      });
      const save = page.getByRole('button', { name: 'Save', exact: true });
      await expect(month).toHaveText('01');
      await expect(day).toHaveText('02');
      await expect(page.getByLabel('Superseded display')).toHaveText(
        '01/02/26'
      );
      await month.fill('10');
      await day.fill('15');
      await year.fill('2026');
      await page.getByRole('button', { name: /choose date/i }).click();
      await page.getByRole('gridcell', { name: '16', exact: true }).click();
      await save.click();
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('saved-policy')!).supersededAtUtc
        )
      ).toBe('2026-10-16T00:00:00.000Z');
      await page.reload();
      await page.addScriptTag({ content: bundle });
      await expect(month).toHaveText('10');
      await expect(day).toHaveText('16');
      await expect(year).toHaveText('2026');
      await year.fill('0000');
      await expect(save).toBeDisabled();
      await year.fill('2026');
      await expect(save).toBeEnabled();
      await year.fill('');
      await year.press('Tab');
      await expect(save).toBeDisabled();
      await picker.getByRole('button', { name: 'Clear', exact: true }).click();
      await expect(save).toBeEnabled();
      await save.click();
      await expect(picker).toHaveCount(0);
      await expect(page.getByLabel('Superseded display')).toHaveText('Current');
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('saved-policy')!).supersededAtUtc ??
            null
        )
      ).toBeNull();
    });
  });
}
