import React, { useEffect } from "react";
import { Dashboard } from "./Dashboard";
import { Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";
import { Settings } from "./Settings/Settings";
import { FamilyScreen } from "./Families/FamilyScreen";
import { Communities } from "./Communities/Communities";
import { UserProfile } from "./UserProfile/UserProfile";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { LocationContext, selectedLocationContextState, userOrganizationAccessQuery } from "./Model/Data";
import ShellRootLayout from "./Shell/ShellRootLayout";
import { ProgressBackdrop } from "./Shell/ProgressBackdrop";
import { useScopedTrace } from "./Hooks/useScopedTrace";

function RouteMigrator() {
  const location = useLocation();
  const navigate = useNavigate();

  const userOrganizationAccess = useRecoilValue(userOrganizationAccessQuery);
  const firstOrganization = userOrganizationAccess.organizations?.at(0);
  const firstLocation = firstOrganization?.locations?.at(0);

  useEffect(() => {
    if (firstLocation) {
      //TODO: Only do this if the old path is a valid/migrate-able path to begin with.
      const target = `${firstOrganization?.organizationId}/${firstLocation.locationId}${location.pathname}` +
        `${location.search}${location.hash}`;
      console.log(`Attempting to migrate route to: ${target}`);
      navigate(target);
    } else {
      console.log("Could not migrate route. User organization access state was:")
      console.log(userOrganizationAccess);
    }
  }, [navigate, firstOrganization, firstLocation, location, userOrganizationAccess]);

  return (
    <ProgressBackdrop opaque>
      <p>Attempting to migrate a suspected old link:</p>
      <pre>{window.location.href}</pre>
      <p>If you are not redirected in a few seconds, please submit a bug report.</p>
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
  const trace = useScopedTrace("LocationContext");
  const { organizationId, locationId } = useParams<{ organizationId: string, locationId: string }>();
  const updateLocationContext = useRecoilCallback(({set, reset, snapshot}) => (context: LocationContext) => {
    set(selectedLocationContextState, context);
  });

  // We only need to change this on first load or when the location context actually changes.
  useEffect(() => {
    trace("Effect");
    if (organizationId && locationId) {
      trace("Updating location context");
      updateLocationContext({ organizationId, locationId });
    } else {
      trace(`Location context was NOT updated. ` +
        `organizationId: '${organizationId}'` +
        `locationId: '${locationId}'`);
    }
  }, [organizationId, locationId, trace, updateLocationContext]);
  
  return (
    <ShellRootLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="families/:familyId" element={<FamilyScreen />} />
        <Route path="referrals/*" element={<Referrals />} />
        <Route path="volunteers/*" element={<Volunteers />} />
        <Route path="communities/*" element={<Communities />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="*" element={<RouteError />} />
      </Routes>
    </ShellRootLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/:organizationId/:locationId/*" element={<LocationContextWrapper />}>
      </Route>
      <Route path="/me" /*TODO: This needs a shell!*/ element={<UserProfile />} />
      <Route path="*" element={<RouteMigrator />} />
    </Routes>
  );
}