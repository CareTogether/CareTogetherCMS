export const AUTH_FILE = 'playwright/.auth/admin.json';

export const ATLANTIS_ORGANIZATION_ID =
  '11111111-1111-1111-1111-111111111111';
export const ATLANTIS_LOCATION_ID = '22222222-2222-2222-2222-222222222222';

export const KEYCLOAK_TOKEN_STORAGE_KEY = 'caretogether.keycloak.tokens';
export const KEYCLOAK_PKCE_STORAGE_KEY = 'caretogether.keycloak.pkce';

export function locationRoute(
  organizationId: string,
  locationId: string
): string {
  return `/org/${organizationId}/${locationId}/`;
}

export const ATLANTIS_ROUTE = locationRoute(
  ATLANTIS_ORGANIZATION_ID,
  ATLANTIS_LOCATION_ID
);
