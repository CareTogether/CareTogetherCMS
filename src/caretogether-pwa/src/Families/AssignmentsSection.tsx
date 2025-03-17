import { Grid, Typography, Card, CardContent, Box } from '@mui/material';
import { CombinedFamilyInfo, ArrangementEntry } from '../GeneratedClient';
import { format } from 'date-fns';
import {
  usePersonAndFamilyLookup,
  useFamilyLookup,
} from '../Model/DirectoryModel';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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

interface AssignmentCardProps {
  assignment: ArrangementEntry;
}

function AssignmentCard({ assignment }: AssignmentCardProps) {
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();

  const isCompleted = assignment.endedAtUtc !== undefined;
  const progressWidth = isCompleted ? '100%' : '50%';
  const statusColor = isCompleted ? '#2E7D32' : '#E3AE01';

  const personInfo = assignment.partneringFamilyPersonId
    ? personAndFamilyLookup(assignment.partneringFamilyPersonId)
    : null;

  const currentLocation = assignment.childLocationHistory?.length
    ? assignment.childLocationHistory[
        assignment.childLocationHistory.length - 1
      ]
    : null;

  const currentLocationName = currentLocation
    ? familyLookup(currentLocation.childLocationFamilyId)?.family?.name
    : 'Unspecified';

  const nextPlannedLocation = assignment.childLocationPlan?.length
    ? assignment.childLocationPlan.find(
        (entry) =>
          !currentLocation ||
          (entry.timestampUtc &&
            currentLocation.timestampUtc &&
            new Date(entry.timestampUtc) >
              new Date(currentLocation.timestampUtc) &&
            entry.childLocationFamilyId !==
              currentLocation.childLocationFamilyId)
      ) ||
      assignment.childLocationPlan
        .slice()
        .reverse()
        .find(
          (entry) =>
            entry.childLocationFamilyId !==
            currentLocation?.childLocationFamilyId
        ) ||
      null
    : null;

  const nextPlanIsPastDue =
    nextPlannedLocation?.timestampUtc &&
    new Date(nextPlannedLocation.timestampUtc) < new Date();

  const nextPlannedLocationName = nextPlannedLocation
    ? familyLookup(nextPlannedLocation.childLocationFamilyId)?.family?.nam
    : 'No upcoming plans';

  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '150px' }}
    >
      <Box
        sx={{
          height: 8,
          backgroundColor: statusColor,
          width: progressWidth,
          transition: 'width 0.5s ease-in-out',
        }}
      />

      <CardContent>
        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          {assignment.arrangementType || 'Unknown Type'}
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {personInfo?.person
            ? `${personInfo.person.firstName} ${personInfo.person.lastName}`
            : 'Unknown Person'}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            marginTop: 1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2">
              <strong>Started:</strong>{' '}
              {assignment.startedAtUtc
                ? format(new Date(assignment.startedAtUtc), 'MM/dd/yyyy')
                : ' '}
            </Typography>
            <Typography variant="body2">
              <strong>Ended:</strong>{' '}
              {assignment.endedAtUtc
                ? format(new Date(assignment.endedAtUtc), 'MM/dd/yyyy')
                : ' '}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PersonPinCircleIcon sx={{ color: 'gray' }} />{' '}
              {currentLocationName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CalendarTodayIcon sx={{ color: 'gray' }} />{' '}
              <span style={{ color: nextPlanIsPastDue ? 'red' : 'inherit' }}>
                {nextPlannedLocationName}
              </span>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
