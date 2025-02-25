import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsScreen } from './SettingsScreen';
import { RoleEdit } from './Roles/RoleEdit';

function Settings() {
  return (
    <Routes>
      <Route path="" element={<SettingsScreen />} />
      <Route path="roles/:roleName" element={<RoleEdit />} />
      <Route path="*" element={<Navigate to="./roles" replace />} />
    </Routes>
  );
}

export { Settings };
