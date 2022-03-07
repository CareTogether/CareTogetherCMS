import { Grid } from '@mui/material';

function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item style={{textAlign: 'center', margin: 12}}>
        <h1>Welcome to the CareTogether Case Management System!</h1>
        <p>Select an option from the menu to begin.</p>
      </Grid>
    </Grid>
  );
}

export { Dashboard };
