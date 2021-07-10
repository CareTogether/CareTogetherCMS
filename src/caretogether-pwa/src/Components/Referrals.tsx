import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { referralsData, useRefreshReferrals } from '../Model/ReferralsModel';

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

function Referrals() {
  const classes = useStyles();
  const referrals = useRecoilValue(referralsData);
  const refreshReferrals = useRefreshReferrals();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className={clsx(classes.paper, classes.fixedHeight)}>
          <button onClick={refreshReferrals}>🔃 Refresh Referrals</button>
          <br />
          <table>
            <thead>
              <tr>
                <th>Data as JSON for testing</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(referral => (
                <tr key={referral.id}>
                  <td>{JSON.stringify(referral)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      </Grid>
    </Grid>
  );
}

export { Referrals };
