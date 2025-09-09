import { Navigate, Route, Routes, useMatch } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';

export function V1Cases() {
  const familyId = useMatch('/cases/family/:familyId');

  return (
    <>
      <Routes>
        <Route path="" element={<PartneringFamilies />} />
        <Route
          path="family/:familyId"
          element={<Navigate to={`/families/${familyId?.params.familyId}`} />}
        />
        <Route path="*" element={<Navigate to=".." replace />} />
      </Routes>
    </>
  );
}
