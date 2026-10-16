import { expect, test } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import type {} from './organization-category-form-harness';

test.use({ storageState: { cookies: [], origins: [] } });
let bundle: string;
test.beforeAll(async () => {
  const mocks: Record<string, string> = {
    'Model/DirectoryModel': `export const useCommunityCommand = factory => async id => { const command = factory(id); window.categoryFormCommands.push(command.toJSON()); };`,
    'Hooks/useBackdrop': `export const useBackdrop = () => async callback => callback();`,
    'Hooks/useAppNavigate': `export const useAppNavigate = () => ({ organization: () => window.dispatchEvent(new Event('organization-created')) });`,
    'Model/Data': `export const useRequiredSelectedLocationContext = () => ({ organizationId: 'tenant', locationId: 'location' });`,
  };
  const result = await build({
    input: fileURLToPath(
      new URL('./organization-category-form-harness.tsx', import.meta.url)
    ),
    platform: 'browser',
    tsconfig: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    },
    plugins: [
      {
        name: 'form-context',
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
    write: false,
  });
  const chunk = result.output.find((item) => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Missing form bundle');
  bundle = chunk.code;
});

test.beforeEach(async ({ page }) => {
  await page.route('**/category-form*', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body><div id="root"></div></body></html>',
    })
  );
});

test('Add and Edit share visible sorted optional checkboxes', async ({
  page,
}) => {
  for (const query of ['', '?edit']) {
    await page.goto(`/category-form${query}`);
    await page.addScriptTag({ content: bundle });
    const group = page.getByRole('group', { name: 'Categories', exact: true });
    await expect(group).toBeVisible();
    await expect(group.getByRole('checkbox')).toHaveCount(2);
    await expect(group.locator('label')).toHaveText(['Advocacy', 'Housing']);
    await expect(
      group.getByRole('checkbox', { name: 'Advocacy', exact: true })
    ).not.toBeChecked();
    const housing = group.getByRole('checkbox', {
      name: 'Housing',
      exact: true,
    });
    if (query) await expect(housing).toBeChecked();
    else await expect(housing).not.toBeChecked();
    await expect(housing).not.toHaveAttribute('required');
  }
});

test('creation serializes selected categories and opens Edit with them selected', async ({
  page,
}) => {
  await page.goto('/category-form');
  await page.addScriptTag({ content: bundle });
  await expect(
    page.getByRole('button', { name: 'Save', exact: true })
  ).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Housing', exact: true }).check();
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('New organization');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.categoryFormCommands[0]))
    .toMatchObject({
      discriminator: 'CreateCommunity',
      name: 'New organization',
      categoryIds: ['category-b'],
    });
  await expect(
    page.getByRole('heading', { name: 'Edit Organization' })
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Housing', exact: true })
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Advocacy', exact: true })
  ).not.toBeChecked();
});

test('creation without categories preserves the empty default', async ({
  page,
}) => {
  await page.goto('/category-form');
  await page.addScriptTag({ content: bundle });
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Uncategorized');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.categoryFormCommands[0]))
    .toMatchObject({ categoryIds: [] });
});

for (const selected of [['Housing'], ['Advocacy', 'Housing']]) {
  test(`creation displays ${selected.length} category badges in organization grid`, async ({
    page,
  }) => {
    await page.goto('/category-form');
    await page.addScriptTag({ content: bundle });
    await page
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('New organization');
    for (const name of selected) {
      await page.getByRole('checkbox', { name, exact: true }).check();
    }
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(() => window.categoryFormCommands[0].categoryIds)
      )
      .toEqual(
        selected.map((name) =>
          name === 'Housing' ? 'category-b' : 'category-a'
        )
      );
    const cell = page
      .getByRole('gridcell')
      .filter({ has: page.locator('.MuiChip-root') });
    await expect(cell.locator('.MuiChip-label')).toHaveText(selected);
  });
}

test('Edit still saves categories with the existing command', async ({
  page,
}) => {
  await page.goto('/category-form?edit');
  await page.addScriptTag({ content: bundle });
  await page.getByRole('checkbox', { name: 'Advocacy', exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.categoryFormCommands[0]))
    .toMatchObject({
      discriminator: 'SetOrganizationCategories',
      categoryIds: ['category-b', 'category-a'],
    });
});

test('empty configuration and disabled feature preserve existing behavior', async ({
  page,
}) => {
  await page.goto('/category-form?empty');
  await page.addScriptTag({ content: bundle });
  await expect(page.getByText(/No categories are configured/)).toBeVisible();
  await page.goto('/category-form?disabled');
  await page.addScriptTag({ content: bundle });
  await expect(
    page.getByRole('group', { name: 'Categories', exact: true })
  ).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('labels and keyboard toggle categories and Edit can clear all selections', async ({
  page,
}) => {
  await page.goto('/category-form?edit');
  await page.addScriptTag({ content: bundle });
  const housing = page.getByRole('checkbox', { name: 'Housing', exact: true });
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await expect(save).toBeDisabled();
  await page
    .getByRole('group', { name: 'Categories', exact: true })
    .getByText('Housing', { exact: true })
    .click();
  await expect(housing).not.toBeChecked();
  await housing.focus();
  await page.keyboard.press('Space');
  await expect(housing).toBeChecked();
  await expect(save).toBeDisabled();
  await housing.uncheck();
  await save.click();
  await expect
    .poll(() => page.evaluate(() => window.categoryFormCommands[0]))
    .toMatchObject({
      discriminator: 'SetOrganizationCategories',
      categoryIds: [],
    });
});
