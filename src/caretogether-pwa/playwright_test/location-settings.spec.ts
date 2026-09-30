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
    await expect(
      page.getByRole('button', { name: 'Add new location' })
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
