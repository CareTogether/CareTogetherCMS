import { Badge, Grid } from '@mui/material';
import { Referral } from '../../GeneratedClient';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export default function RequirementsList({ referral }: { referral: Referral }) {
  const completedRequirements = referral.completedRequirements || [];
  const exemptedRequirements = referral.exemptedRequirements || [];
  const missingRequirements = referral.missingRequirements || [];

  return (
    <>
      <Grid container>
        <Grid item xs={3}>
          <Badge color="success" badgeContent={completedRequirements?.length}>
            <CheckCircleIcon sx={{ color: 'green' }} />
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="warning" badgeContent={exemptedRequirements?.length}>
            <BlockIcon sx={{ color: 'red' }} />
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="error" badgeContent={missingRequirements?.length}>
            <CloseIcon sx={{ color: 'red' }} />
          </Badge>
        </Grid>
        <Grid item xs={3}>
          <Badge color="info">
            <CalendarTodayIcon sx={{ color: '#005B64' }} />
          </Badge>
        </Grid>
      </Grid>
    </>
  );
}
