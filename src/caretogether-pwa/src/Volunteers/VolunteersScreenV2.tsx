import { Box, Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Permission } from '../GeneratedClient';
import { useGlobalPermissions } from '../Model/SessionModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';

export function VolunteersScreenV2() {
  useScreenTitle('Volunteers');
  const globalPermissions = useGlobalPermissions();
  const hasFeaturebaseChat = globalPermissions(Permission.AccessSupportScreen);

  return (
    <Box
      sx={{
        ...wideTablePageSx(hasFeaturebaseChat),
      }}
    >
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Outlet context={{ version: 'v2' }} />
      </Stack>
    </Box>
  );
}
