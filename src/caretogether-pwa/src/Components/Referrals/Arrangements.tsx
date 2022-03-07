import clsx from 'clsx';
import makeStyles from '@mui/styles/makeStyles';
import { Grid, Paper } from '@mui/material';

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

function Arrangements() {
  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8} lg={9}>
        <Paper className={clsx(classes.paper, classes.fixedHeight)}>
          Area 1
        </Paper>
      </Grid>
      <Grid item xs={12} md={4} lg={3}>
        <Paper className={clsx(classes.paper, classes.fixedHeight)}>
          Area 2
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          Area 3
        </Paper>
      </Grid>
    </Grid>
  );
}

export { Arrangements };
