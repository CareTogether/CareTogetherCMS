import { randomUUID } from 'node:crypto';
import { expect, test } from './support/fixtures';
import { ATLANTIS_ORGANIZATION_ID, ATLANTIS_ROUTE } from './support/constants';
import { sideNavigation } from './support/navigation';
import { ORGANIZATION_CATEGORIES_FEATURE_FLAG } from '../src/featureFlags';

test.use({ featureFlags: { [ORGANIZATION_CATEGORIES_FEATURE_FLAG]: true } });

test.describe('organization category persistence @pr', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    // CI explicitly opts in for its disposable Atlantis tenant. Local runs must
    // receive the same approval; saved authentication alone is insufficient.
    expect(
      process.env.CT_E2E_DISPOSABLE_TENANT,
      'Live creation requires approval for the disposable Atlantis tenant'
    ).toBe('true');
    expect(baseURL, 'A local AppHost frontend URL is required').toBeTruthy();
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(
      new URL(baseURL!).hostname
    );
    // A local frontend could be configured with a remote API. Refuse all API
    // writes outside the approved local tenant before any request is sent.
    await page.route('**/api/**', async (route) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.pathname.startsWith(`/api/${ATLANTIS_ORGANIZATION_ID}/`)
      ) {
        await route.abort('blockedbyclient');
        throw new Error(
          'Refused API write outside the local disposable Atlantis tenant'
        );
      }
      await route.continue();
    });
  });

  test('creates with an existing category and retains it after reload and in Edit', async ({
    page,
  }) => {
    const suffix = randomUUID();
    const categoryName = `E2E Category ${suffix}`;
    const organizationName = `E2E Organization ${suffix}`;
    const organizationsRoute = `${ATLANTIS_ROUTE}organizations`;

    // The seed configuration has no categories. Provision an existing option
    // through the real Settings UI, only inside the opted-in disposable tenant.
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
      .getByRole('combobox', { name: 'Categories', exact: true })
      .click();
    await page.getByRole('option', { name: categoryName, exact: true }).click();
    await page.keyboard.press('Escape');
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
      page.getByRole('combobox', { name: 'Categories', exact: true })
    ).toBeVisible();
    await expect(page.locator('.MuiAutocomplete-tag')).toHaveText([
      categoryName,
    ]);
  });
});
