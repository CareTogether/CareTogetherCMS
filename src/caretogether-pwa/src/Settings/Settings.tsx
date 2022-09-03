import { Navigate, Route, Routes } from 'react-router-dom';
import { RoleSettings } from './RoleSettings';

function Settings() {
  return (
    <Routes>
      <Route path="roles" element={<RoleSettings />} />
      <Route path="*" element={<Navigate to='./roles' replace />} />
    </Routes>
  );
}

export { Settings };
