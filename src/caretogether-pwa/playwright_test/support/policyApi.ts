import type { Page } from '@playwright/test';
import { ATLANTIS_LOCATION_ID, ATLANTIS_ORGANIZATION_ID } from './constants';

// The policy editor runs in the real app; only its policy endpoints are stubbed so
// tests control the policy and validation responses without changing seeded data.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PolicyJson = Record<string, any>;

export type PolicyValidationJson = { errors: string[]; warnings: string[] };

type PolicyStubOptions = {
  organizationId?: string;
  locationId?: string;
  // Builds the stubbed policy from the location's real policy.
  policy?: (realPolicy: PolicyJson) => PolicyJson;
};

export function locationPolicyPath(
  locationId = ATLANTIS_LOCATION_ID,
  organizationId = ATLANTIS_ORGANIZATION_ID
) {
  return `/api/${organizationId}/${locationId}/Configuration/policy`;
}

export function locationSettingsPath(
  editingLocationId = ATLANTIS_LOCATION_ID,
  tab = 'basic'
) {
  return (
    `/org/${ATLANTIS_ORGANIZATION_ID}/${ATLANTIS_LOCATION_ID}` +
    `/settings/locations/${editingLocationId}?tab=${tab}`
  );
}

// Serves the location policy from memory: PUT stores the request body and returns it,
// so saves never reach the API.
export async function stubLocationPolicy(
  page: Page,
  {
    organizationId = ATLANTIS_ORGANIZATION_ID,
    locationId = ATLANTIS_LOCATION_ID,
    policy = (realPolicy) => realPolicy,
  }: PolicyStubOptions = {}
) {
  const path = locationPolicyPath(locationId, organizationId);
  let stored: PolicyJson | undefined;
  let puts = 0;

  await page.route(
    (url) => url.pathname === path,
    async (route) => {
      if (stored === undefined) {
        const response = await route.fetch({ method: 'GET' });
        stored = policy(await response.json());
      }
      if (route.request().method() === 'PUT') {
        puts++;
        stored = route.request().postDataJSON() as PolicyJson;
      }
      await route.fulfill({ json: stored });
    }
  );

  return {
    stored: () => stored,
    puts: () => puts,
  };
}

export async function stubPolicyValidation(
  page: Page,
  respond: (
    policy: PolicyJson,
    validationNumber: number
  ) => PolicyValidationJson | Promise<PolicyValidationJson>,
  {
    organizationId = ATLANTIS_ORGANIZATION_ID,
    locationId = ATLANTIS_LOCATION_ID,
  }: Omit<PolicyStubOptions, 'policy'> = {}
) {
  const path = `${locationPolicyPath(locationId, organizationId)}/validation`;
  let validations = 0;

  await page.route(
    (url) => url.pathname === path,
    async (route) => {
      validations++;
      const json = await respond(
        route.request().postDataJSON() as PolicyJson,
        validations
      );
      await route.fulfill({ json });
    }
  );

  return { validations: () => validations };
}
