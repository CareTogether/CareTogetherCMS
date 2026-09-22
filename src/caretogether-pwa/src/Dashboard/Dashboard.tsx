import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { v2Typography } from '../Families/v2Typography';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Container, Stack, Typography } from '@mui/material';
import {
  useLocationConfiguration,
  useOrganizationConfiguration,
} from '../Model/ConfigurationModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { DashboardCalendar } from './DashboardCalendar';

function Dashboard() {
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  const organizationConfiguration = useOrganizationConfiguration();
  const locationConfiguration = useLocationConfiguration();

  useScreenTitle('Dashboard');

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Stack direction="column">
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
