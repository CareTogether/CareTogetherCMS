import { Grid, Skeleton, Typography } from '@mui/material';
import { useRecoilValueLoadable } from 'recoil';
import { locationConfigurationQuery, organizationConfigurationQuery } from './Model/ConfigurationModel';
import useScreenTitle from './Shell/ShellScreenTitle';

function Dashboard() {
  const organizationConfiguration = useRecoilValueLoadable(organizationConfigurationQuery);
  const locationConfiguration = useRecoilValueLoadable(locationConfigurationQuery);

  useScreenTitle("Dashboard");

  return (
    <Grid container spacing={3}>
      <Grid item style={{textAlign: 'center', margin: 12}}>
        <br />
        <Typography variant='h4' component='h3'>Welcome to the CareTogether Case Management System!</Typography>
        <br />
        <Typography variant='body1'>Select an option from the menu to begin.</Typography>
        <br />
        {locationConfiguration.state === 'hasValue' && organizationConfiguration.state === 'hasValue'
          ? <p style={{lineHeight: 1}}>Current location: <strong>{locationConfiguration.contents?.name}</strong> ({organizationConfiguration.contents?.organizationName})</p>
          : <Skeleton variant='text' animation='wave' width={300} sx={{marginLeft: 'auto', marginRight: 'auto'}} />}
      </Grid>
    </Grid>
  );
}

export { Dashboard };
