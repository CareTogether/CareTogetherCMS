import { Grid, Typography, Button } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { AssignmentCard } from '../Families/AssignmentCard';
import { useState } from 'react';

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
}

export function AssignmentsSection({ family }: AssignmentsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const assignments = [...(family.volunteerFamilyInfo?.assignments ?? [])].sort(
    (a, b) => {
      const dateA = a.startedAtUtc ? new Date(a.startedAtUtc).getTime() : 0;
      const dateB = b.startedAtUtc ? new Date(b.startedAtUtc).getTime() : 0;
      return dateB - dateA;
    }
  );

  if (assignments.length === 0) return null;

  const visibleAssignments = showAll ? assignments : assignments.slice(0, 9);

  return (
    <Grid item xs={12}>
      <Typography variant="h3" sx={{ marginBottom: 2 }}>
        Assignments
      </Typography>
      <Grid container spacing={2}>
        {visibleAssignments.map((assignment, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <AssignmentCard assignment={assignment} />
          </Grid>
        ))}
      </Grid>

      {assignments.length > 9 && (
        <Button
          variant="outlined"
          onClick={() => setShowAll((prev) => !prev)}
          sx={{ marginTop: 2 }}
        >
          {showAll ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </Grid>
  );
}
