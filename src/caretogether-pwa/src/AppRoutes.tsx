import React from "react";
import { Dashboard } from "./Dashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";
import { Settings } from "./Settings/Settings";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="referrals/*" element={<Referrals />} />
      <Route path="volunteers/*" element={<Volunteers />} />
      <Route path="settings/*" element={<Settings />} />
      {/* TODO: Remove this once a dashboard view exists. */}
      <Route path="*" element={<Navigate to="../volunteers" replace />} />
    </Routes>
  );
}