import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsScreen } from './SettingsScreen';
import { RoleEditScreen } from './Roles/RoleEditScreen';
import { LocationEdit } from './Roles/LocationEdit';
import { RolesScreen } from './Roles/RolesScreen';
import { LocationsScreen } from './LocationsScreen';

function Settings() {
  return (
    <Routes>
      <Route path="" element={<SettingsScreen />} />
      <Route path="roles" element={<RolesScreen />} />
      <Route path="locations" element={<LocationsScreen />} />
      <Route path="roles/:roleName" element={<RoleEditScreen />} />
      <Route path="locations/:locationId" element={<LocationEdit />} />
      <Route path="*" element={<Navigate to="./roles" replace />} />
    </Routes>
  );
}

export { Settings };
