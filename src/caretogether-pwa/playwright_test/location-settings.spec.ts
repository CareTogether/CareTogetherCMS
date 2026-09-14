import { test } from './support/fixtures';
import {
  ATLANTIS_LOCATION_ID,
  ATLANTIS_ORGANIZATION_ID,
  EL_DORADO_LOCATION_ID,
} from './support/constants';

test.describe('location settings @smoke @pr', () => {
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
