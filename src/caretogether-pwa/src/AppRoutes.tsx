import { Dashboard } from "./Dashboard";
import { Routes, Route, Navigate } from "react-router-dom";
import { Referrals } from "./Referrals/Referrals";
import { Volunteers } from "./Volunteers/Volunteers";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="referrals/*" element={<Referrals />} />
      <Route path="volunteers/*" element={<Volunteers />} />
      {/* TODO: Remove this once a dashboard view exists. */}
      <Route path="*" element={<Navigate to="../volunteers" replace />} />
    </Routes>
  );
}