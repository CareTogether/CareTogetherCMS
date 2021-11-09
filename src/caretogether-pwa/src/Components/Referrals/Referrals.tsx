import { Route, Routes, Navigate } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';
import { PartneringFamilyScreen } from './PartneringFamilyScreen';

function Referrals() {
  return (
    <>
      <Routes>
        <Route path='/' element={<PartneringFamilies />} />
        <Route path='/family/:partneringFamilyId' element={<PartneringFamilyScreen />} />
        <Route element={<Navigate to='/' />} />
      </Routes>
    </>
  );
}

export { Referrals };
