import { Grid, Skeleton, Typography } from '@mui/material';
import { useRecoilValueLoadable } from 'recoil';
import { locationNameQuery, organizationNameQuery } from './Model/ConfigurationModel';
import useScreenTitle from './Shell/ShellScreenTitle';

function Dashboard() {
  const organizationName = useRecoilValueLoadable(organizationNameQuery);
  const locationName = useRecoilValueLoadable(locationNameQuery);

  useScreenTitle("Dashboard");

  return (
    <Grid container spacing={3}>
      <Grid item style={{textAlign: 'center', margin: 12}}>
        <Typography variant='h4' component='h3'>Welcome to the CareTogether Case Management System!</Typography>
        <br />
        <Typography variant='body1'>Select an option from the menu to begin.</Typography>
        <br />
        {locationName.state === 'hasValue' && organizationName.state === 'hasValue'
          ? <p style={{lineHeight: 1}}>Current location: <strong>{locationName.contents}</strong> ({organizationName.contents})</p>
          : <Skeleton variant='text' animation='wave' width={300} sx={{marginLeft: 'auto', marginRight: 'auto'}} />}
      </Grid>
    </Grid>
  );
}

export { Dashboard };
