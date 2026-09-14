import { expect, test } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';

let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    input: fileURLToPath(
      new URL('./referrals-review-harness.tsx', import.meta.url)
    ),
    platform: 'browser',
    tsconfig: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    },
    plugins: [
      {
        name: 'exclude-local',
        resolveId(source) {
          if (source.split(/[\\/]/).some((part) => part.includes('.local')))
            throw new Error('Excluded path');
          return null;
        },
      },
    ],
    output: { format: 'iife' },
    write: false,
  });
  const output = result.output.find((item) => item.type === 'chunk');
  if (!output || output.type !== 'chunk')
    throw new Error('Missing browser bundle');
  bundle = output.code;
});

test('native Referrals grid mounts and resets incompatible reporting data', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setContent('<html><body><div id="root"></div></body></html>');
  await page.addScriptTag({ content: bundle });
  await expect(page.getByRole('grid')).toBeVisible();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(
    page.getByRole('menuitem', { name: 'Download as CSV', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Download as Excel', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Print', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Referral 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('searchbox').first().fill(' REFERRAL 0 ');
  await expect(page.getByText('Referral 1', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Referral 0', { exact: true })).toBeVisible();
  await page.getByRole('searchbox').first().fill('');
  await expect(page.getByText('Referral 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /pivot/i }).click();
  await expect(
    page.getByText('Program', { exact: true }).first()
  ).toBeVisible();
  await page.getByRole('switch', { name: 'Pivot', exact: true }).check();
  await expect(
    page.getByRole('switch', { name: 'Pivot', exact: true })
  ).toBeChecked();
  await page
    .locator('.MuiDataGrid-pivotPanelField')
    .filter({ has: page.getByText('Program', { exact: true }) })
    .dragTo(page.locator('[data-section="rows"]'));
  await page
    .locator('.MuiDataGrid-pivotPanelField')
    .filter({ has: page.getByText('Referral count', { exact: true }) })
    .dragTo(page.locator('[data-section="values"]'));
  await expect(
    page.getByRole('gridcell').filter({ hasText: /^3$/ }).first()
  ).toBeVisible();
  await page.getByRole('gridcell').filter({ hasText: /^3$/ }).first().click();
  await expect(page.locator('output')).toHaveText('');
  await page.getByRole('button', { name: 'Toggle authorized rows' }).click();
  await expect(page.getByText('Referral 0', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle authorized rows' }).click();
  await expect(page.getByText('Referral 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /pivot/i }).click();
  await page.getByRole('switch', { name: 'Pivot', exact: true }).check();
  await page
    .locator('.MuiDataGrid-pivotPanelField')
    .filter({ has: page.getByText('Program', { exact: true }) })
    .dragTo(page.locator('[data-section="rows"]'));
  await page
    .locator('.MuiDataGrid-pivotPanelField')
    .filter({ has: page.getByText('Referral count', { exact: true }) })
    .dragTo(page.locator('[data-section="values"]'));
  await expect(
    page.getByRole('gridcell').filter({ hasText: /^3$/ }).first()
  ).toBeVisible();
  await page.getByRole('button', { name: 'Toggle configuration' }).click();
  await expect(page.getByText('Referral 0', { exact: true })).toBeVisible();
  await page.getByText('Referral 0', { exact: true }).click();
  await expect(page.locator('output')).toHaveText('0');
  await page.getByRole('button', { name: /pivot/i }).click();
  await expect(page.getByText('Program', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
