import { Box, Stack } from '@mui/material';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { Permission } from '../GeneratedClient';
import { useGlobalPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
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
  const globalPermissions = useGlobalPermissions();
  const volunteersBasePath = volunteersBasePathFromPathname(location.pathname);
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);

  return (
    <Box
      sx={{
        ...wideTablePageSx(hasFeaturebaseChat),
      }}
    >
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Routes>
          <Route index element={<VolunteersBrowserV2 />} />
          <Route
            path="approval"
            element={<Navigate to={volunteersBasePath} replace />}
          />
          <Route
            path="family/:familyId"
            element={<VolunteerFamilyRedirect />}
          />
          <Route
            path="*"
            element={<Navigate to={volunteersBasePath} replace />}
          />
        </Routes>
      </Stack>
    </Box>
  );
}
