import { Navigate, Route, Routes, useMatch } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
//import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';
import { useSessionStorage } from '../Hooks/useSessionStorage';

function Volunteers() {
  const isApproval = useMatch('/volunteers/approval');
  const isProgress = useMatch('/volunteers/progress');
  const selectedScreen = isApproval
    ? 'approval'
    : isProgress
      ? 'progress'
      : 'approval';

  const [lastVolunteersScreen, setLastVolunteersScreen] = useSessionStorage<
    'approval' | 'progress'
  >('volunteer-lastScreen', selectedScreen);

  const familyId = useMatch('/volunteers/family/:familyId');

  return (
    <Routes>
      <Route
        path="approval"
        element={
          <VolunteerApproval
            onOpen={() => setLastVolunteersScreen('approval')}
          />
        }
      />
      {/* <Route path="applications" element={<VolunteerApplications />} /> */}
      <Route
        path="progress"
        element={
          <VolunteerProgress
            onOpen={() => setLastVolunteersScreen('progress')}
          />
        }
      />
      <Route
        path="family/:familyId"
        element={<Navigate to={`/families/${familyId?.params.familyId}`} />}
      />
      <Route
        path="*"
        element={<Navigate to={`../${lastVolunteersScreen}`} replace />}
      />
    </Routes>
  );
}

export { Volunteers };
