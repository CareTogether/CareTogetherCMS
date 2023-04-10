import React from "react";
import { Dashboard } from "./Dashboard";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";
import { Settings } from "./Settings/Settings";
import { FamilyScreen } from "./Families/FamilyScreen";
import { Communities } from "./Communities/Communities";
import { UserProfile } from "./UserProfile/UserProfile";
import { useRecoilValue } from "recoil";
import { userOrganizationAccessQuery } from "./Model/Data";
import ShellRootLayout from "./Shell/ShellRootLayout";

function RouteMigrator() {
  const location = useLocation();
  const navigate = useNavigate();

  const userOrganizationAccess = useRecoilValue(userOrganizationAccessQuery);
  const firstOrganization = userOrganizationAccess.organizations?.at(0);
  const firstLocation = firstOrganization?.locations?.at(0);

  if (firstLocation) {
    //TODO: Only do this if the old path is a valid/migrate-able path to begin with.
    const target = `${firstOrganization?.organizationId}/${firstLocation.locationId}/${location.pathname}` +
      `${location.search}${location.hash}`;
    console.log(`Attempting to migrate route to: ${target}`);
    navigate(target);
  } else {
    console.log("Could not migrate route. User organization access state was:")
    console.log(userOrganizationAccess);
  }

  return (
    <RouteError />
  );
}

function RouteError(): React.ReactElement {
  throw new Error(`The URL path '${window.location.href}' is invalid.`);
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/:organizationId/:locationId">
        <Route element={<ShellRootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="families/:familyId" element={<FamilyScreen />} />
          <Route path="referrals/*" element={<Referrals />} />
          <Route path="volunteers/*" element={<Volunteers />} />
          <Route path="communities/*" element={<Communities />} />
          <Route path="settings/*" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/me" /*TODO: This needs a shell!*/ element={<UserProfile />} />
      <Route path="*" element={<RouteMigrator />} />
    </Routes>
  );
}