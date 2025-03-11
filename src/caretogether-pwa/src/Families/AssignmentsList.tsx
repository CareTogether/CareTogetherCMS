import { CombinedFamilyInfo, ArrangementEntry } from '../GeneratedClient';
import { Grid, Card, CardContent, Typography } from '@mui/material';

interface AssignmentsListProps {
  family: CombinedFamilyInfo;
  assignments: { referralId?: string; arrangement: ArrangementEntry }[];
}

export function AssignmentsList({ assignments }: AssignmentsListProps) {
  return (
    <Grid container spacing={2}>
      {assignments.map((assignment, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ padding: 2 }}>
            <CardContent>
              <Typography variant="h6">
                {assignment.arrangement.arrangementType || 'Unknown Assignment'}
              </Typography>
              <Typography variant="body2">
                Referral ID: {assignment.referralId || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Status: {assignment.arrangement.active ? 'Active' : 'Inactive'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
