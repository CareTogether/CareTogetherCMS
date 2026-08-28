import { Container, Stack, Typography } from '@mui/material';
import {
  useLocationConfiguration,
  useOrganizationConfiguration,
} from '../Model/ConfigurationModel';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { DashboardCalendar } from './DashboardCalendar';

function Dashboard() {
  const organizationConfiguration = useOrganizationConfiguration();
  const locationConfiguration = useLocationConfiguration();

  useScreenTitle('Dashboard');

  return (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Stack direction="column">
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ marginTop: 3 }}>
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
