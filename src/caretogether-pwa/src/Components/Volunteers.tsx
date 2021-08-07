import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData, useRefreshVolunteerFamilies } from '../Model/VolunteerFamiliesModel';

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

function Volunteers() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const refreshVolunteerFamilies = useRefreshVolunteerFamilies();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className={clsx(classes.paper)}>
          <button onClick={refreshVolunteerFamilies}>🔃 Refresh Volunteers</button>
          <br />
          <table>
            <thead>
              <tr>
                {/* TODO: Render the family name as the name of the primary family contact */}
                <th>Data as JSON for testing</th>
              </tr>
            </thead>
            <tbody>
              {volunteerFamilies.map(volunteerFamily => (
                <tr key={volunteerFamily.family?.id}>
                  <td>{JSON.stringify(volunteerFamily)}<br />================</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      </Grid>
    </Grid>
  );
}

export { Volunteers };
