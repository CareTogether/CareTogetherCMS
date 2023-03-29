import React from "react";
import { Dashboard } from "./Dashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";
import { Settings } from "./Settings/Settings";
import { FamilyScreen } from "./Families/FamilyScreen";
import { Communities } from "./Communities/Communities";
import { UserProfile } from "./UserProfile/UserProfile";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="families/:familyId" element={<FamilyScreen />} />
      <Route path="referrals/*" element={<Referrals />} />
      <Route path="volunteers/*" element={<Volunteers />} />
      <Route path="communities/*" element={<Communities />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="me/*" element={<UserProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}