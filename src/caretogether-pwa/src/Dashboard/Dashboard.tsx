import { Container, Stack, Typography } from '@mui/material';
import {
  useLocationConfigurationLoadable,
  useOrganizationConfigurationLoadable,
} from '../Model/ConfigurationModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { DashboardCalendar } from './DashboardCalendar';

function Dashboard() {
  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const locationConfiguration = useLocationConfigurationLoadable();

  const dataLoaded = useDataLoaded();

  useScreenTitle('Dashboard');

  return !dataLoaded ||
    (locationConfiguration.state !== 'hasValue' &&
      organizationConfiguration.state !== 'hasValue') ? (
    <ProgressBackdrop>
      <p>Loading dashboard...</p>
    </ProgressBackdrop>
  ) : (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Stack direction="column">
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ marginTop: 3 }}>
            <strong>{locationConfiguration.contents?.name}</strong> (
            {organizationConfiguration.contents?.organizationName})
          </Typography>
        </Stack>
        <DashboardCalendar />
      </Stack>
    </Container>
  );
}

export { Dashboard };
