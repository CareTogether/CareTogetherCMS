import { Navigate, Route, Routes } from 'react-router-dom';
import { CommunitiesList } from './CommunitiesList';
import { CommunityScreen } from './CommunityScreen';

export function Organizations() {
  return (
    <Routes>
      <Route path="" element={<CommunitiesList />} />
      <Route path="organization/:communityId" element={<CommunityScreen />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
