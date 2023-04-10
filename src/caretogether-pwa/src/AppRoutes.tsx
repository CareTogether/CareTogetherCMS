import React from "react";
import { Dashboard } from "./Dashboard";
import { Routes, Route } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";
import { Settings } from "./Settings/Settings";
import { FamilyScreen } from "./Families/FamilyScreen";
import { Communities } from "./Communities/Communities";
import { UserProfile } from "./UserProfile/UserProfile";

function RouteError(): React.ReactElement {
  throw new Error(`The URL path '${window.location.href}' is invalid.`);
}

export function AppRoutes() { //TODO: Merge this with Shell components from index.ts for clearer integration?
  return (
    <Routes>
      <Route path="/:organizationId/:locationId" /*TODO: Include a layout route under this for the shell*/>
        <Route path="/" element={<Dashboard />} />
        <Route path="families/:familyId" element={<FamilyScreen />} />
        <Route path="referrals/*" element={<Referrals />} />
        <Route path="volunteers/*" element={<Volunteers />} />
        <Route path="communities/*" element={<Communities />} />
        <Route path="settings/*" element={<Settings />} />
      </Route>
      <Route path="me/*" element={<UserProfile />} />
      <Route path="*" element={<RouteError />}
      /* TODO: If it's a valid old path (pre-org+loc path) then
               try redirecting based on the user's first available organization and location. */ />
    </Routes>
  );
}