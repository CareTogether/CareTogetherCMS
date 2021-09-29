import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { referralsData, useRefreshReferrals } from '../Model/ReferralsModel';
import { Key } from 'react';

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
        <Paper className={clsx(classes.paper)}>
          <button onClick={refreshReferrals}>🔃 Refresh Referrals</button>
          <br />
          <table>
            <thead>
              <tr>
                {/* TODO: Render the family name as the name of the primary family contact */}
                <th>Data as JSON for testing</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral: { id: Key | null | undefined; }) => (
                <tr key={referral.id}>
                  <td>{JSON.stringify(referral)}<br />================</td>
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
