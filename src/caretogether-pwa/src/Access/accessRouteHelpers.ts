import type { LocationContext } from '../Model/Data';
import type { UserAccess } from '../GeneratedClient';

export const LAST_VISITED_LOCATION = 'lastVisitedLocation';

export function hasLocationAccess(
  userOrganizationAccess: UserAccess,
  locationContext: LocationContext
) {
  return (
    userOrganizationAccess.organizations?.some(
      (organization) =>
        organization.organizationId === locationContext.organizationId &&
        organization.locations?.some(
          (location) => location.locationId === locationContext.locationId
        )
    ) ?? false
  );
}

function firstAccessibleLocation(
  userOrganizationAccess: UserAccess
): LocationContext | null {
  const firstOrganization = userOrganizationAccess.organizations?.find(
    (organization) =>
      organization.organizationId &&
      organization.locations?.some((location) => location.locationId)
  );
  const firstLocation = firstOrganization?.locations?.find(
    (location) => location.locationId
  );

  if (!firstOrganization?.organizationId || !firstLocation?.locationId) {
    return null;
  }

  return {
    organizationId: firstOrganization.organizationId,
    locationId: firstLocation.locationId,
  };
}

export function preferredAccessibleLocation(
  userOrganizationAccess: UserAccess,
  lastVisitedLocation: LocationContext | null
): LocationContext | null {
  if (
    lastVisitedLocation &&
    hasLocationAccess(userOrganizationAccess, lastVisitedLocation)
  ) {
    return lastVisitedLocation;
  }

  return firstAccessibleLocation(userOrganizationAccess);
}
