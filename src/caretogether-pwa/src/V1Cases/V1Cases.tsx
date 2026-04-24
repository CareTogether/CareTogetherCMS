import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';

export function V1Cases() {
  const { familyId } = useParams<{ familyId: string }>();

  return (
    <>
      <Routes>
        <Route path="" element={<PartneringFamilies />} />
        <Route
          path="family/:familyId"
          element={<Navigate to={`/families/${familyId}`} />}
        />
        <Route path="*" element={<Navigate to=".." replace />} />
      </Routes>
    </>
  );
}
