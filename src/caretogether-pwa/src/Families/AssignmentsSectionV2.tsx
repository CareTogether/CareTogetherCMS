import Grid from '../Generic/GridLegacyCompat';
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  ArrangementEntry,
  CombinedFamilyInfo,
  PartneringFamilyInfo,
} from '../GeneratedClient';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { useState } from 'react';
import { WideTableContainer } from '../Utilities/WideTableContainer';
import { containedStickyHeaderTableSx } from '../Utilities/stickyHeaderTableSx';
import { FamilyName } from './FamilyName';
import { format } from 'date-fns';
import { useLoadable } from '../Hooks/useLoadable';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';

const MAX_INITIAL_ASSIGNMENT_ITEMS = 9;

interface AssignmentsSectionProps {
  family: CombinedFamilyInfo;
  hideTitle?: boolean;
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

function formatDate(date?: Date) {
  return date ? format(date, 'M/d/yyyy') : '-';
}

function assignmentStatus(assignment: ArrangementEntry) {
  if (assignment.cancelledAtUtc) return 'Cancelled';
  if (assignment.endedAtUtc) return 'Ended';
  if (assignment.active) return 'Active';
  return 'Pending';
}

function assignmentStatusColor(assignment: ArrangementEntry) {
  if (assignment.cancelledAtUtc) return 'default';
  if (assignment.endedAtUtc) return 'success';
  if (assignment.active) return 'info';
  return 'warning';
}

export function AssignmentsSection({
  family,
  hideTitle = false,
}: AssignmentsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const personAndFamilyLookup = usePersonAndFamilyLookup();
  const familyLookup = useFamilyLookup();
  const partneringFamilies = useLoadable(partneringFamiliesData);
  const navigate = useAppNavigate();

  const assignments = [...(family.volunteerFamilyInfo?.assignments ?? [])].sort(
    (a, b) => {
      const dateA = a.startedAtUtc?.getTime() ?? 0;
      const dateB = b.startedAtUtc?.getTime() ?? 0;
      return dateB - dateA;
    }
  );

  if (assignments.length === 0) return null;

  const visibleAssignments = showAll
    ? assignments
    : assignments.slice(0, MAX_INITIAL_ASSIGNMENT_ITEMS);

  return (
    <Grid item xs={12}>
      {!hideTitle && (
        <Typography variant="h3" sx={{ marginBottom: 2 }}>
          Assignments
        </Typography>
      )}
      <WideTableContainer>
        <Table
          aria-label="Assignments"
          stickyHeader
          size="small"
          sx={{ ...containedStickyHeaderTableSx, minWidth: 1000 }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Person</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Ended</TableCell>
              <TableCell>Current Location</TableCell>
              <TableCell>Next Planned Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleAssignments.map((assignment) => {
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
              const nextPlannedLocationFamily =
                nextPlannedLocation?.childLocationFamilyId
                  ? familyLookup(nextPlannedLocation.childLocationFamilyId)
                  : null;
              const nextPlanIsPastDue =
                nextPlannedLocation &&
                nextPlannedLocation.timestampUtc! < new Date();
              const childFamily = partneringFamilies?.find(
                (fam) =>
                  fam.partneringFamilyInfo &&
                  allArrangements(fam.partneringFamilyInfo).some(
                    (a) => a.arrangement.id === assignment.id
                  )
              );
              const childFamilyId = childFamily?.family?.id;

              return (
                <TableRow
                  key={assignment.id}
                  hover={Boolean(childFamilyId)}
                  sx={{
                    cursor: childFamilyId ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (childFamilyId) navigate.family(childFamilyId);
                  }}
                >
                  <TableCell>{assignment.arrangementType || '-'}</TableCell>
                  <TableCell>
                    {personInfo?.person
                      ? `${personInfo.person.firstName} ${personInfo.person.lastName}`
                      : 'Unknown Person'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assignmentStatus(assignment)}
                      color={assignmentStatusColor(assignment)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(assignment.startedAtUtc)}</TableCell>
                  <TableCell>{formatDate(assignment.endedAtUtc)}</TableCell>
                  <TableCell>
                    {latestLocationFamily ? (
                      <FamilyName family={latestLocationFamily} />
                    ) : (
                      'Location Unspecified'
                    )}
                  </TableCell>
                  <TableCell>
                    {nextPlannedLocationFamily ? (
                      <span
                        style={{
                          color: nextPlanIsPastDue ? '#d32f2f' : undefined,
                          fontWeight: nextPlanIsPastDue ? 600 : undefined,
                        }}
                      >
                        <FamilyName family={nextPlannedLocationFamily} />
                        {nextPlannedLocation?.timestampUtc
                          ? ` on ${format(
                              nextPlannedLocation.timestampUtc,
                              'M/d/yyyy'
                            )}`
                          : ''}
                      </span>
                    ) : (
                      'No upcoming plans'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </WideTableContainer>

      {assignments.length > MAX_INITIAL_ASSIGNMENT_ITEMS && (
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
