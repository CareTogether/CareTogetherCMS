import {
  settingsSections,
  settingsSectionPath,
  settingsCategoryForSection,
} from '../src/Settings/settingsSections';
import { SELF_SERVICE_POLICY_FEATURE_FLAG } from '../src/featureFlags';
import { expect, test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  EL_DORADO_LOCATION_ID,
} from './support/constants';

test.describe('location settings @smoke @pr', () => {
  test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: true } });
  test('opens the selected location configuration from Settings', async ({
    page,
  }) => {
    await page.goto(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        '/settings/locations'
    );

    await expect(page).toHaveURL(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        '/settings/locations'
    );
    const breadcrumb = page.getByLabel('breadcrumb');
    await expect(breadcrumb).toContainText('Settings');
    await expect(breadcrumb).toContainText('Location Settings');
    await expect(
      breadcrumb.getByText('Location', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Editing Atlantis configuration' })
    ).toBeVisible();
    await expect(
      breadcrumb.getByText('Locations', { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Add New Location' })
    ).toHaveCount(0);

    const locationSwitcher = page.getByRole('combobox', {
      name: 'Location',
      exact: true,
    });
    await locationSwitcher.click();
    await expect(
      page.getByRole('button', { name: 'Add New Location' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Add New Location' }).click();
    await expect(
      page.getByRole('heading', { name: 'Add New Location' })
    ).toBeVisible();
    await expect(page).toHaveURL(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        '/settings/locations'
    );

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(
      page.getByRole('heading', { name: 'Add New Location' })
    ).not.toBeVisible();
  });

  test('describes the selected location settings card', async ({ page }) => {
    await page.goto(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}/settings`
    );

    await page.getByRole('button', { name: /^Location Settings/ }).click();
    await expect(page).toHaveURL(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}/settings/location-settings`
    );
    await expect(
      page.getByRole('button', {
        name: /^Location Configure basic administration/,
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        'Configure basic administration for the selected location.'
      )
    ).toBeVisible();
    await page
      .getByRole('button', { name: /^Location Configure basic administration/ })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Editing Atlantis configuration' })
    ).toBeVisible();
  });

  test('loads the policy for the location being edited', async ({ page }) => {
    const editedLocationPolicyPath =
      `/api/${ATLANTIS_ORGANIZATION_ID}/${EL_DORADO_LOCATION_ID}` +
      '/Configuration/policy';
    const editedLocationPolicyResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === editedLocationPolicyPath
    );

    await page.goto(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        `/settings/locations/${EL_DORADO_LOCATION_ID}?tab=casePolicy`
    );

    expect((await editedLocationPolicyResponse).ok()).toBe(true);
    await expect(page).toHaveURL(
      settingsSectionPath(
        ATLANTIS_ORGANIZATION_ID,
        EL_DORADO_LOCATION_ID,
        'casePolicy'
      )
    );
    await expect(
      page.getByRole('combobox', { name: 'Location', exact: true })
    ).toContainText('El Dorado');
    await expect(
      page.getByRole('grid', { name: 'Case Policies requirements matrix' })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('grid', { name: 'Case Policies requirements matrix' })
    ).toBeVisible();
  });
});

test.describe('dedicated Settings sidebar', () => {
  test.use({ featureFlags: { [SELF_SERVICE_POLICY_FEATURE_FLAG]: true } });
  test('all configuration links navigate and identify the active section', async ({
    page,
  }) => {
    for (const section of settingsSections) {
      await page.goto(
        settingsSectionPath(
          ATLANTIS_ORGANIZATION_ID,
          ATLANTIS_LOCATION_ID,
          section.id
        )
      );
      const navigation = page.getByRole('list', {
        name: 'secondary navigation',
      });
      const category = settingsCategoryForSection(section.id);
      const item = navigation.getByRole('link', {
        name: category.label,
        exact: true,
      });
      await item.scrollIntoViewIfNeeded();
      await expect(item).toHaveClass(/Mui-selected/);
      await expect(item).toHaveAttribute('aria-current', 'location');
      await item.click();
      await page
        .getByRole('button', { name: new RegExp('^' + section.label) })
        .click();
      await expect(page).toHaveURL(
        settingsSectionPath(
          ATLANTIS_ORGANIZATION_ID,
          ATLANTIS_LOCATION_ID,
          section.id
        )
      );
    }
  });
});
