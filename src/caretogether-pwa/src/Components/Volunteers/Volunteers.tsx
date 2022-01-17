import { Navigate, Route, Routes } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
//import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';
import { VolunteerFamilyScreen } from './VolunteerFamilyScreen';

function Volunteers() {
  return (
    <Routes>
      <Route path="approval" element={<VolunteerApproval />} />
      {/* <Route path="applications" element={<VolunteerApplications />} /> */}
      <Route path="progress" element={<VolunteerProgress />} />
      <Route path="family/:familyId" element={<VolunteerFamilyScreen />} />
      <Route path="*" element={<Navigate to="../approval" replace />} />
    </Routes>
  );
}

export { Volunteers };
