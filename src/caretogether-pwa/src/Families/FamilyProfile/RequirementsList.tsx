import { Badge, Grid } from '@mui/material';
import { Referral } from '../../GeneratedClient';

export default function RequirementsList({ referral }: { referral: Referral }) {
  const completedRequirements = referral.completedRequirements || [];
  const exemptedRequirements = referral.exemptedRequirements || [];
  const missingRequirements = referral.missingRequirements || [];

  return (
    <>
      <Grid container>
        <Grid item xs={3}>
          <Badge color="success" badgeContent={completedRequirements?.length}>
            ✅
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="warning" badgeContent={exemptedRequirements?.length}>
            🚫
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="error" badgeContent={missingRequirements?.length}>
            ❌
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="info">📅</Badge>
        </Grid>
      </Grid>
    </>
  );
}
