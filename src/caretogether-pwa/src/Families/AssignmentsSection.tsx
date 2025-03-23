import { Grid, Typography, Card, CardContent, Box } from '@mui/material';
import {
  CombinedFamilyInfo,
  ArrangementEntry,
  PartneringFamilyInfo,
} from '../GeneratedClient';
import { format } from 'date-fns';
import {
  usePersonAndFamilyLookup,
  useFamilyLookup,
} from '../Model/DirectoryModel';
import { partneringFamiliesData } from '../Model/ReferralsModel';
import { useLoadable } from '../Hooks/useLoadable';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { FamilyName } from '../Families/FamilyName';
import { useNavigate } from 'react-router-dom';

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

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const results: { referralId: string; arrangement: ArrangementEntry }[] = [];
  partneringFamilyInfo.closedReferrals?.forEach((x) =>
    x.arrangements?.forEach((y) =>
      results.push({ referralId: x.id!, arrangement: y })
    )
  );
  partneringFamilyInfo.openReferral?.arrangements?.forEach((x) =>
    results.push({
      referralId: partneringFamilyInfo.openReferral!.id!,
      arrangement: x,
    })
  );
  return results;
}

function AssignmentCard({ assignment }: AssignmentCardProps) {
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const navigate = useNavigate();

  const isCompleted = assignment.endedAtUtc !== undefined;
  const progressWidth = isCompleted ? '100%' : '50%';
  const statusColor = isCompleted ? '#2E7D32' : '#E3AE01';

  const personInfo = assignment.partneringFamilyPersonId
    ? personAndFamilyLookup(assignment.partneringFamilyPersonId)
    : null;

  const latestLocationId = assignment.childLocationHistory?.length
    ? assignment.childLocationHistory[
        assignment.childLocationHistory.length - 1
      ].childLocationFamilyId
    : null;

  const latestLocationFamily = latestLocationId
    ? familyLookup(latestLocationId)
    : null;

  const nextPlannedLocationId = assignment.childLocationPlan?.length
    ? assignment.childLocationPlan.find(
        (entry) => new Date(entry.timestampUtc!) > new Date()
      )?.childLocationFamilyId || null
    : null;

  const nextPlannedLocationFamily = nextPlannedLocationId
    ? familyLookup(nextPlannedLocationId)
    : null;

  const nextPlannedLocation =
    assignment.childLocationPlan?.find(
      (entry) => new Date(entry.timestampUtc!) > new Date()
    ) ?? null;

  const nextPlanIsPastDue =
    nextPlannedLocation && nextPlannedLocation.timestampUtc! < new Date();

  const childFamily = partneringFamilies?.find(
    (fam) =>
      fam.partneringFamilyInfo &&
      allArrangements(fam.partneringFamilyInfo).some(
        (a) => a.arrangement.id === assignment.id
      )
  );

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '150px',
        cursor: childFamily?.family?.id ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: childFamily?.family?.id ? '#f5f5f5' : 'inherit',
        },
      }}
      onClick={() => {
        if (childFamily?.family?.id) {
          navigate(`/families/${childFamily.family.id}`);
        }
      }}
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
            gap: 1,
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
              <PersonPinCircleIcon sx={{ color: 'gray' }} />
              {latestLocationFamily ? (
                <FamilyName family={latestLocationFamily} />
              ) : (
                'Location Unspecified'
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CalendarTodayIcon sx={{ color: 'gray' }} />
              <span style={{ color: nextPlanIsPastDue ? 'red' : 'inherit' }}>
                {nextPlannedLocationFamily ? (
                  <FamilyName family={nextPlannedLocationFamily} />
                ) : (
                  'No upcoming plans'
                )}
              </span>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
