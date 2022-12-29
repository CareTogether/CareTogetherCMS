import { Navigate, Route, Routes } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';
import { FamilyScreen } from './PartneringFamilyScreen';

function Referrals() {
  return (
    <>
      <Routes>
        <Route path="" element={<PartneringFamilies />} />
        <Route path="family/:familyId" element={<FamilyScreen />} />
        <Route path="*" element={<Navigate to=".." replace />} />
      </Routes>
    </>
  );
}

export { Referrals };
