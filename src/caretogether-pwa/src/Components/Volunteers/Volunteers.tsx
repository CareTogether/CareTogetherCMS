import { Navigate, Route, Routes, useMatch } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
//import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';
import { VolunteerFamilyScreen } from './VolunteerFamilyScreen';
import { useSessionStorage } from '../../useSessionStorage';

function Volunteers() {
  const isApproval = useMatch('/volunteers/approval');
  const isProgress = useMatch('/volunteers/progress');
  const selectedScreen = isApproval ? 'approval' : isProgress ? 'progress' : 'approval';

  const [lastVolunteersScreen, setLastVolunteersScreen] = useSessionStorage<'approval' | 'progress'>('volunteer-lastScreen', selectedScreen);

  return (
    <Routes>
      <Route path="approval" element={<VolunteerApproval onOpen={() => setLastVolunteersScreen('approval')} />} />
      {/* <Route path="applications" element={<VolunteerApplications />} /> */}
      <Route path="progress" element={<VolunteerProgress onOpen={() => setLastVolunteersScreen('progress')} />} />
      <Route path="family/:familyId" element={<VolunteerFamilyScreen />} />
      <Route path="*" element={<Navigate to={`../${lastVolunteersScreen}`} replace />} />
    </Routes>
  );
}

export { Volunteers };
