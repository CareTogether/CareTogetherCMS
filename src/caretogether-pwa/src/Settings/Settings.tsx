import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsScreen } from './SettingsScreen';
import { RoleEditScreen } from './Roles/RoleEditScreen';

function Settings() {
  return (
    <Routes>
      <Route path="" element={<SettingsScreen />} />
      <Route path="roles/:roleName" element={<RoleEditScreen />} />
      <Route path="*" element={<Navigate to="./roles" replace />} />
    </Routes>
  );
}

export { Settings };
