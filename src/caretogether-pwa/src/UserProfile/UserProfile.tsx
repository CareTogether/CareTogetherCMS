import { Navigate, Route, Routes } from 'react-router-dom';
import { RedeemPersonInvite } from './RedeemPersonInvite';
import { UserProfileInfo } from './UserProfileInfo';

function UserProfile() {
  return (
    <Routes>
      <Route path="" element={<UserProfileInfo />} />
      <Route path="redeemPersonInvite" element={<RedeemPersonInvite />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

export { UserProfile };
