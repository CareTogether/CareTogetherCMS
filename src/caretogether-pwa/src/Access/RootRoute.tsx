import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { useUserOrganizationAccess } from '../Model/Data';
import type { LocationContext } from '../Model/Data';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import {
  LAST_VISITED_LOCATION,
  preferredAccessibleLocation,
} from './accessRouteHelpers';
import { NoOrganizationAccessScreen } from './NoOrganizationAccessScreen';

export function RootRoute() {
  const userOrganizationAccess = useUserOrganizationAccess();
  const [lastVisitedLocation] = useLocalStorage<LocationContext | null>(
    LAST_VISITED_LOCATION,
    null
  );
  const targetContext = useMemo(
    () =>
      userOrganizationAccess
        ? preferredAccessibleLocation(
            userOrganizationAccess,
            lastVisitedLocation
          )
        : null,
    [userOrganizationAccess, lastVisitedLocation]
  );

  if (userOrganizationAccess == null) {
    return (
      <ProgressBackdrop opaque>
        <p>Loading access...</p>
      </ProgressBackdrop>
    );
  }

  if (targetContext == null) {
    return <NoOrganizationAccessScreen />;
  }

  return (
    <Navigate
      to={`/org/${targetContext.organizationId}/${targetContext.locationId}/`}
      replace
    />
  );
}
