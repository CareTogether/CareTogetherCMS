import { Navigate, Route, Routes, useMatch } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';

function Referrals() {
  const familyId = useMatch('/referrals/family/:familyId');
  
  return (
    <>
      <Routes>
        <Route path="" element={<PartneringFamilies />} />
        <Route path="family/:familyId" element={<Navigate to={`/families/${familyId?.params.familyId}`} />} />
        <Route path="*" element={<Navigate to=".." replace />} />
      </Routes>
    </>
  );
}

export { Referrals };
