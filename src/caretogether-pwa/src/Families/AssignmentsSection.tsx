import { Grid, Typography } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { AssignmentCard } from '../Families/AssignmentCard';

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
}

export function AssignmentsSection({ family }: AssignmentsSectionProps) {
  const assignments = family.volunteerFamilyInfo?.assignments ?? [];

  if (assignments.length === 0) return null;

  return (
    <Grid item xs={12}>
      <Typography variant="h3" sx={{ marginBottom: 2 }}>
        Assignments
      </Typography>
      <Grid container spacing={2}>
        {assignments.map((assignment, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <AssignmentCard assignment={assignment} />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
