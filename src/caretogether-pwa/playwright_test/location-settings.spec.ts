import { expect, test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  EL_DORADO_LOCATION_ID,
} from './support/constants';

test.describe('location settings @smoke @pr', () => {
  test('opens the selected location configuration from Settings', async ({
    page,
  }) => {
    const selectedLocationPolicyPath =
      `/api/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
      '/Configuration/policy';
    const selectedLocationPolicyRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        new URL(request.url()).pathname === selectedLocationPolicyPath
    );

    await page.goto(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        '/settings/locations'
    );

    await expect(page).toHaveURL(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        `/settings/locations/${ATLANTIS_LOCATION_ID}`
    );
    await selectedLocationPolicyRequest;
    const breadcrumb = page.getByLabel('breadcrumb');
    await expect(breadcrumb).toContainText('Settings');
    await expect(breadcrumb).toContainText('Atlantis');
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
        `/settings/locations/${ATLANTIS_LOCATION_ID}`
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

    await expect(
      page.getByRole('heading', { name: 'Location', exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(
        'Configure settings, policies, and custom fields for the selected location.'
      )
    ).toBeVisible();
  });

  test('loads the policy for the location being edited', async ({ page }) => {
    const editedLocationPolicyPath =
      `/api/${ATLANTIS_ORGANIZATION_ID}/${EL_DORADO_LOCATION_ID}` +
      '/Configuration/policy';
    const editedLocationPolicyRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        new URL(request.url()).pathname === editedLocationPolicyPath
    );

    await page.goto(
      `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
        `/settings/locations/${EL_DORADO_LOCATION_ID}`
    );

    await editedLocationPolicyRequest;
  });
});
