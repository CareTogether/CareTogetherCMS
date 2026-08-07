import { Box, Stack } from '@mui/material';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { VolunteersBrowserV2 } from './VolunteersBrowserV2';

function volunteersBasePathFromPathname(pathname: string) {
  const volunteersPathMatch = pathname.match(/^(.*\/volunteers)(?:\/.*)?$/);

  return volunteersPathMatch?.[1] ?? pathname;
}

function VolunteerFamilyRedirect() {
  const { familyId } = useParams<{ familyId: string }>();

  return <Navigate to={`/families/${familyId}`} />;
}

export function VolunteersScreenV2() {
  useScreenTitle('Volunteers');
  const location = useLocation();
  const volunteersBasePath = volunteersBasePathFromPathname(location.pathname);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Routes>
          <Route index element={<VolunteersBrowserV2 />} />
          <Route
            path="approval"
            element={<Navigate to={volunteersBasePath} replace />}
          />
          <Route path="family/:familyId" element={<VolunteerFamilyRedirect />} />
          <Route
            path="*"
            element={<Navigate to={volunteersBasePath} replace />}
          />
        </Routes>
      </Stack>
    </Box>
  );
}
