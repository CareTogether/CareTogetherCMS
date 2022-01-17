import { Dashboard } from "@material-ui/icons";
import { Routes, Route, Navigate } from "react-router-dom";
import { Arrangements } from "./Components/Referrals/Arrangements";
import { Referrals } from "./Components/Referrals/Referrals";
import { Volunteers } from "./Components/Volunteers/Volunteers";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="arrangements/*" element={<Arrangements />} />
      <Route path="referrals/*" element={<Referrals />} />
      <Route path="volunteers/*" element={<Volunteers />} />
      {/* TODO: Remove this once a dashboard view exists. */}
      <Route path="*" element={<Navigate to="../volunteers" replace />} />
    </Routes>
  );
}