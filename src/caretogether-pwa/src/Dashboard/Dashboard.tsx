import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { v2Typography } from '../Families/v2Typography';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Container, Stack, Typography } from '@mui/material';
import {
  useLocationConfiguration,
  useOrganizationConfiguration,
} from '../Model/ConfigurationModel';
import { Permission } from '../GeneratedClient';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { DashboardCalendar } from './DashboardCalendar';

function Dashboard() {
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  const organizationConfiguration = useOrganizationConfiguration();
  const locationConfiguration = useLocationConfiguration();
  const permissions = useGlobalPermissionsLoadable();

  useScreenTitle('Dashboard');

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        boxSizing: 'border-box',
        ...wideTablePageSx(permissions(Permission.AccessSupportScreen)),
        minWidth: 0,
        overflow: 'auto',
      }}
    >
      <Stack direction="column" sx={{ minHeight: '100%', minWidth: 0 }}>
        {isV2 && (
          <Typography
            className="ph-unmask"
            {...v2Typography.pageTitle}
            component="h1"
            sx={{ mt: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 }, flexShrink: 0 }}
          >
            Dashboard
          </Typography>
        )}
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ marginTop: isV2 ? 0 : 3 }}>
            <strong>{locationConfiguration?.name}</strong> (
            {organizationConfiguration?.organizationName})
          </Typography>
        </Stack>
        <DashboardCalendar />
      </Stack>
    </Container>
  );
}

export { Dashboard };
