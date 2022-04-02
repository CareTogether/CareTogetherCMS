import { Grid } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { organizationConfigurationData } from '../Model/ConfigurationModel';
import { currentLocationState } from '../Model/SessionModel';

function Dashboard() {
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);
  const currentLocationId = useRecoilValue(currentLocationState);
  const currentLocationName = organizationConfiguration.locations?.find(x => x.id === currentLocationId)?.name;

  return (
    <Grid container spacing={3}>
      <Grid item style={{textAlign: 'center', margin: 12}}>
        <h1>Welcome to the CareTogether Case Management System!</h1>
        <p>Select an option from the menu to begin.</p>
        <br />
        <p>Current location: <strong>{currentLocationName}</strong></p>
      </Grid>
    </Grid>
  );
}

export { Dashboard };
