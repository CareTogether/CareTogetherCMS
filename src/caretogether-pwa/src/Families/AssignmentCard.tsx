import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  PersonPinCircle as PersonPinCircleIcon,
} from '@mui/icons-material';
import { ArrangementEntry, PartneringFamilyInfo } from '../GeneratedClient';
import {
  usePersonAndFamilyLookup,
  useFamilyLookup,
} from '../Model/DirectoryModel';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { format } from 'date-fns';
import { FamilyName } from './FamilyName';
import { getAssignmentStatus } from './assignmentStatus';

interface AssignmentCardProps {
  assignment: ArrangementEntry;
}

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const closedV1CaseArrangements =
    partneringFamilyInfo.closedV1Cases?.flatMap(
      (v1Case) =>
        v1Case.arrangements?.map((arrangement) => ({
          referralId: v1Case.id!,
          arrangement,
        })) ?? []
    ) ?? [];

  const openV1CaseArrangements =
    partneringFamilyInfo.openV1Case?.arrangements?.map((arrangement) => ({
      referralId: partneringFamilyInfo.openV1Case!.id!,
      arrangement,
    })) ?? [];

  return [...closedV1CaseArrangements, ...openV1CaseArrangements];
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const navigate = useAppNavigate();

  const status = getAssignmentStatus(assignment);

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

  const nextPlannedLocation =
    assignment.childLocationPlan?.find(
      (entry) => new Date(entry.timestampUtc!) > new Date()
    ) ?? null;

  const nextPlannedLocationFamily = nextPlannedLocation?.childLocationFamilyId
    ? familyLookup(nextPlannedLocation.childLocationFamilyId)
    : null;

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
          navigate.family(childFamily.family.id);
        }
      }}
    >
      <Box
        sx={{
          height: 8,
          backgroundColor: status.color,
          width: status.progressWidth,
          transition: 'width 0.5s ease-in-out',
        }}
      />

      <CardContent>
        <Box
          sx={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
            marginBottom: 1,
          }}
        >
          <Typography variant="h6">
            {assignment.arrangementType || 'Unknown Type'}
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              backgroundColor: status.color,
              color: 'white',
              flexShrink: 0,
              fontWeight: 600,
            }}
          />
        </Box>

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
