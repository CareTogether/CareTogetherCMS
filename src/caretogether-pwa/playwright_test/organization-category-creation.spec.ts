import { randomUUID } from 'node:crypto';
import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { sideNavigation } from './support/navigation';
import { ORGANIZATION_CATEGORIES_FEATURE_FLAG } from '../src/featureFlags';

test.use({ featureFlags: { [ORGANIZATION_CATEGORIES_FEATURE_FLAG]: true } });

test.describe('organization category persistence @pr', () => {
  test('creates with an existing category and retains it after reload and in Edit', async ({
    page,
  }) => {
    const suffix = randomUUID();
    const categoryName = `E2E Category ${suffix}`;
    const organizationName = `E2E Organization ${suffix}`;
    const organizationsRoute = `${ATLANTIS_ROUTE}organizations`;

    // The seed configuration has no categories, so create one in Settings first.
    await page.goto(`${ATLANTIS_ROUTE}settings/organization-categories`);
    await page
      .getByRole('button', { name: 'Add Category', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill(categoryName);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Add Category', exact: true })
    ).toBeHidden();
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible();

    await page.goto(organizationsRoute);
    await page.getByRole('button', { name: /^add new organization$/i }).click();
    await page
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill(organizationName);
    await page
      .getByRole('checkbox', { name: categoryName, exact: true })
      .check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`${organizationsRoute}/organization/[^/]+$`)
    );
    await expect(
      page.getByRole('heading', { name: organizationName, exact: true })
    ).toBeVisible();
    const organizationUrl = page.url();

    await sideNavigation(page)
      .getByRole('button', { name: 'Organizations', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${organizationsRoute}$`));
    const toolbar = page.getByRole('toolbar');
    const search = toolbar.getByRole('searchbox');
    if (!(await search.isVisible())) {
      await toolbar.getByRole('button', { name: /^search$/i }).click();
    }
    await search.fill(organizationName);
    const row = page.getByRole('row').filter({
      has: page.getByRole('gridcell', { name: organizationName, exact: true }),
    });
    await expect(row.locator('.MuiChip-label')).toHaveText([categoryName]);

    await page.reload();
    await expect(row.locator('.MuiChip-label')).toHaveText([categoryName]);
    await row
      .getByRole('gridcell', { name: organizationName, exact: true })
      .click();
    await expect(page).toHaveURL(organizationUrl);
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(
      page.getByRole('checkbox', { name: categoryName, exact: true })
    ).toBeChecked();
  });
});
