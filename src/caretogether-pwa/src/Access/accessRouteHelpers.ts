import type { LocationContext } from '../Model/Data';
import type { UserAccess } from '../GeneratedClient';

export const LAST_VISITED_LOCATION = 'lastVisitedLocation';

export function accessibleLocationContexts(
  userOrganizationAccess: UserAccess
): LocationContext[] {
  return (
    userOrganizationAccess.organizations?.flatMap((organization) =>
      organization.organizationId
        ? organization.locations
            ?.filter((location) => location.locationId)
            .map((location) => ({
              organizationId: organization.organizationId,
              locationId: location.locationId,
            })) ?? []
        : []
    ) ?? []
  );
}

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
  const [firstLocation] = accessibleLocationContexts(userOrganizationAccess);

  if (!firstLocation) {
    return null;
  }

  return firstLocation;
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
