import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
}));

function Dashboard() {
  const classes = useStyles();

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
