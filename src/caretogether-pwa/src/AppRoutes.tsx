import React, { useEffect } from 'react';
import { Dashboard } from './Dashboard/Dashboard';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Referrals } from './Referrals/Referrals';
import { Volunteers } from './Volunteers/Volunteers';
import { Settings } from './Settings/Settings';
import { FamilyScreen } from './Families/FamilyScreen';
import { Communities } from './Communities/Communities';
import { UserProfile } from './UserProfile/UserProfile';
import { useRecoilStateLoadable, useRecoilValue } from 'recoil';
import {
  LocationContext,
  selectedLocationContextState,
  userOrganizationAccessQuery,
} from './Model/Data';
import ShellRootLayout from './Shell/ShellRootLayout';
import { ProgressBackdrop } from './Shell/ProgressBackdrop';
import { useScopedTrace } from './Hooks/useScopedTrace';
import { useLoadable } from './Hooks/useLoadable';
import { useLocalStorage } from './Hooks/useLocalStorage';
import { InboxScreen } from './Inbox/InboxScreen';
import { FamilyScreenV2 } from './Families/FamilyScreenV2';
import { familyScreenV2State } from './Families/familyScreenV2State';
import { usePostHogIdentify } from './Utilities/Instrumentation/usePostHogIdentify';
import { usePostHogGroups } from './Utilities/Instrumentation/usePostHogGroups';
import { Support } from './Support';
import { Reports } from './Reports/Reports';

const LAST_VISITED_LOCATION = 'lastVisitedLocation';

function RouteMigrator() {
  const trace = useScopedTrace('RouteMigrator');
  const location = useLocation();
  const navigate = useNavigate();

  const userOrganizationAccess = useLoadable(userOrganizationAccessQuery);
  trace(
    `userOrganizationAccess contents: ${JSON.stringify(
      userOrganizationAccess?.organizations?.map((org) => ({
        organizationId: org.organizationId,
        locations: org.locations?.map((loc) => ({
          locationId: loc.locationId,
          personId: loc.personId,
          roles: loc.roles,
        })),
      }))
    )}`
  );

  const [lastVisitedLocation] = useLocalStorage<LocationContext | null>(
    LAST_VISITED_LOCATION,
    null
  );
  trace(`lastVisitedLocation contents: ${JSON.stringify(lastVisitedLocation)}`);

  useEffect(() => {
    if (userOrganizationAccess == null) {
      return;
    }

    let migrationTargetContext: LocationContext | null = null;

    if (lastVisitedLocation) {
      migrationTargetContext = lastVisitedLocation;
    } else {
      const firstOrganization = userOrganizationAccess?.organizations?.at(0);
      const firstLocation = firstOrganization?.locations?.at(0);
      trace(`firstLocation ID: ${JSON.stringify(firstLocation?.locationId)}`);
      migrationTargetContext =
        firstOrganization && firstLocation
          ? {
              organizationId: firstOrganization.organizationId!,
              locationId: firstLocation.locationId!,
            }
          : null;
    }

    if (migrationTargetContext != null) {
      //TODO: Only do this if the old path is a valid/migrate-able path to begin with.
      const target =
        `/org/${migrationTargetContext.organizationId}/${migrationTargetContext.locationId}${location.pathname}` +
        `${location.search}${location.hash}`;
      trace(`Attempting to migrate route to: ${target}`);
      navigate(target);
    } else {
      trace('Could not migrate route.');
    }
  }, [trace, navigate, location, userOrganizationAccess, lastVisitedLocation]);

  return (
    <ProgressBackdrop opaque>
      <p>Attempting to migrate a suspected old link:</p>
      <pre>{window.location.href}</pre>
      <p>
        If you are not redirected in a few seconds, please submit a bug report.
      </p>
    </ProgressBackdrop>
  );
}

function RouteError(): React.ReactElement {
  throw new Error(`The URL path '${window.location.href}' is invalid.`);
}

// function RouteDisplay(): React.ReactElement {
//   throw new Error(`The URL path '${window.location.href}' is invalid.`);
// }

function LocationContextWrapper() {
  const trace = useScopedTrace('LocationContext');
  const { organizationId, locationId } = useParams<{
    organizationId: string;
    locationId: string;
  }>();

  const [selectedLocationContext, setSelectedLocationContext] =
    useRecoilStateLoadable(selectedLocationContextState);
  const [, setLastVisitedLocation] = useLocalStorage<LocationContext | null>(
    LAST_VISITED_LOCATION,
    null
  );

  const familyScreenV2 = useRecoilValue(familyScreenV2State);

  // We only need to change this on first load or when the location context actually changes.
  useEffect(() => {
    trace(`organizationId: '${organizationId}' -- locationId: '${locationId}'`);

    if (organizationId && locationId) {
      setSelectedLocationContext({ organizationId, locationId });
      setLastVisitedLocation({ organizationId, locationId });
    } else {
      trace(
        `Location context was NOT updated. ` +
          `organizationId: '${organizationId}'` +
          `locationId: '${locationId}'`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, locationId, trace, setSelectedLocationContext]);

  usePostHogGroups();

  usePostHogIdentify();

  return (
    // We need to wait for this to have a value before rendering the child tree; otherwise,
    // the tree will suspend as soon as a data dependency on selectedLocationContextState is encountered, and
    // the effect above (that actually sets the selectedLocationContextState) will not fire.
    selectedLocationContext.state === 'hasValue' &&
      // As an added benefit, we can also use this component to show the spinner when switching locations.
      selectedLocationContext.contents.organizationId === organizationId &&
      selectedLocationContext.contents.locationId === locationId ? (
      <ShellRootLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="inbox/*" element={<InboxScreen />} />
          <Route
            path="families/:familyId"
            element={familyScreenV2 ? <FamilyScreenV2 /> : <FamilyScreen />}
          />
          <Route path="referrals/*" element={<Referrals />} />
          <Route path="volunteers/*" element={<Volunteers />} />
          <Route path="communities/*" element={<Communities />} />
          <Route path="reports/*" element={<Reports />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="support/*" element={<Support />} />
          <Route path="*" element={<RouteError />} />
        </Routes>
      </ShellRootLayout>
    ) : (
      <ProgressBackdrop opaque>
        <p>Setting location...</p>
      </ProgressBackdrop>
    )
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/org/:organizationId/:locationId/*"
        element={<LocationContextWrapper />}
      />
      <Route
        path="/me/*"
        /*TODO: This needs a shell!*/ element={<UserProfile />}
      />
      {/* The following routes are only kept for migration/fallback purposes. */}
      <Route path="/families/:familyId" element={<RouteMigrator />} />
      <Route path="/referrals/*" element={<RouteMigrator />} />
      <Route path="/volunteers/*" element={<RouteMigrator />} />
      <Route path="/communities/*" element={<RouteMigrator />} />
      <Route path="/settings/*" element={<RouteMigrator />} />
      <Route path="/support/*" element={<RouteMigrator />} />
      <Route path="/" element={<RouteMigrator />} />
      <Route path="*" element={<RouteError />} />
    </Routes>
  );
}
