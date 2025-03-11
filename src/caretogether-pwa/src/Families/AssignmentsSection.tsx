import { useState, useEffect } from 'react';
import { getAssignmentsForVolunteerFamily } from '../Utilities/getAssignmentsForVolunteerFamily';
import { CombinedFamilyInfo, ArrangementEntry } from '../GeneratedClient';
import { Grid, Typography } from '@mui/material';
import { AssignmentsList } from './AssignmentsList';

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
}

export function AssignmentsSection({ family }: AssignmentsSectionProps) {
  const [assignments, setAssignments] = useState<
    { referralId?: string; arrangement: ArrangementEntry }[]
  >([]);

  useEffect(() => {
    if (family) {
      const fetchedAssignments = getAssignmentsForVolunteerFamily(family);
      setAssignments(fetchedAssignments);
    }
  }, [family]);

  return (
    <Grid container spacing={2} sx={{ mt: 4 }}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Assignments
        </Typography>
      </Grid>

      {assignments.length > 0 ? (
        <AssignmentsList family={family} assignments={assignments} />
      ) : (
        <Grid item xs={12}>
          <Typography variant="body1" color="textSecondary">
            No assignments available.
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}
