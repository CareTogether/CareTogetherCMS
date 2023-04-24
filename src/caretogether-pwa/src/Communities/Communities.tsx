import { Navigate, Route, Routes } from 'react-router-dom';
import { CommunitiesList } from './CommunitiesList';
import { CommunityScreen } from './CommunityScreen';

export function Communities() {
  return (
    <Routes>
      <Route path="" element={<CommunitiesList />} />
      <Route path="community/:communityId" element={<CommunityScreen />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
