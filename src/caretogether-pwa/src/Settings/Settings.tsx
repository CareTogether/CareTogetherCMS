import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsScreen } from './SettingsScreen';
import { RoleEdit } from './Roles/RoleEdit';
import { LocationEdit } from './Roles/LocationEdit';

function Settings() {
  return (
    <Routes>
      <Route path="" element={<SettingsScreen />} />
      <Route path="roles/:roleName" element={<RoleEdit />} />
      <Route path="locations/:locationId" element={<LocationEdit />} />
      <Route path="*" element={<Navigate to="./roles" replace />} />
    </Routes>
  );
}

export { Settings };
