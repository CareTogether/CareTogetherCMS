import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { v2Typography } from '../Families/v2Typography';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Container, Stack, Typography } from '@mui/material';
import {
  useLocationConfiguration,
  useOrganizationConfiguration,
} from '../Model/ConfigurationModel';
import {
  DESKTOP_BOTTOM_SAFE_AREA,
  MOBILE_BOTTOM_SAFE_AREA,
  SHELL_APP_BAR_HEIGHT,
} from '../Shell/shellLayoutConstants';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { DashboardCalendar } from './DashboardCalendar';

function Dashboard() {
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  const organizationConfiguration = useOrganizationConfiguration();
  const locationConfiguration = useLocationConfiguration();

  useScreenTitle('Dashboard');

  return (
    <Container
      maxWidth={false}
      sx={{
        boxSizing: 'border-box',
        height: {
          xs: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.xs} - ${MOBILE_BOTTOM_SAFE_AREA}px)`,
          sm: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.sm} - ${MOBILE_BOTTOM_SAFE_AREA}px)`,
          md: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.md} - ${DESKTOP_BOTTOM_SAFE_AREA}px)`,
        },
        paddingLeft: '12px',
      }}
    >
      <Stack direction="column" sx={{ height: '100%', minHeight: 0 }}>
        {isV2 && (
          <Typography
            className="ph-unmask"
            {...v2Typography.pageTitle}
            component="h1"
            sx={{ mt: 2, mb: 2 }}
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
