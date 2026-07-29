import { format } from 'date-fns';
import { ArrangementEntry, CombinedFamilyInfo } from '../GeneratedClient';

export type VolunteerAssignmentStatusLabel =
  | 'Cancelled'
  | 'Ended'
  | 'Active'
  | 'Pending';

export type VolunteerAssignmentStatusColor =
  | 'default'
  | 'success'
  | 'info'
  | 'warning';

export type VolunteerAssignmentStatusV2 = {
  color: VolunteerAssignmentStatusColor;
  label: VolunteerAssignmentStatusLabel;
};

export type VolunteerAssignmentRowV2 = {
  id: string;
  assignment: ArrangementEntry;
  childFamilyId?: string;
  currentLocationLabel: string;
  endedLabel: string;
  nextPlanIsPastDue: boolean;
  nextPlannedLocationLabel: string;
  personLabel: string;
  startedLabel: string;
  status: VolunteerAssignmentStatusV2;
  typeLabel: string;
};

type BuildVolunteerAssignmentRowsV2Parameters = {
  assignments: ArrangementEntry[];
  childFamilyIdForAssignment: (assignment: ArrangementEntry) => string | undefined;
  familyLabel: (familyId: string | undefined) => string | undefined;
  personLabel: (personId: string | undefined) => string | undefined;
};

function formatDate(date?: Date) {
  return date ? format(date, 'M/d/yyyy') : '-';
}

function assignmentStatus(assignment: ArrangementEntry): VolunteerAssignmentStatusV2 {
  if (assignment.cancelledAtUtc) {
    return { label: 'Cancelled', color: 'default' };
  }

  if (assignment.endedAtUtc) {
    return { label: 'Ended', color: 'success' };
  }

  if (assignment.active) {
    return { label: 'Active', color: 'info' };
  }

  return { label: 'Pending', color: 'warning' };
}

function currentLocationId(assignment: ArrangementEntry) {
  return assignment.childLocationHistory?.length
    ? assignment.childLocationHistory[
        assignment.childLocationHistory.length - 1
      ].childLocationFamilyId
    : undefined;
}

function nextPlannedLocation(assignment: ArrangementEntry) {
  return (
    assignment.childLocationPlan?.find(
      (entry) => new Date(entry.timestampUtc!) > new Date()
    ) ?? undefined
  );
}

export function buildVolunteerAssignmentRowsV2({
  assignments,
  childFamilyIdForAssignment,
  familyLabel,
  personLabel,
}: BuildVolunteerAssignmentRowsV2Parameters): VolunteerAssignmentRowV2[] {
  return assignments.map((assignment) => {
    const nextPlan = nextPlannedLocation(assignment);
    const nextPlanFamilyLabel = familyLabel(nextPlan?.childLocationFamilyId);
    const nextPlanDate = nextPlan?.timestampUtc
      ? ` on ${format(nextPlan.timestampUtc, 'M/d/yyyy')}`
      : '';

    return {
      id: assignment.id,
      assignment,
      childFamilyId: childFamilyIdForAssignment(assignment),
      currentLocationLabel:
        familyLabel(currentLocationId(assignment)) ?? 'Location Unspecified',
      endedLabel: formatDate(assignment.endedAtUtc),
      nextPlanIsPastDue:
        nextPlan !== undefined && nextPlan.timestampUtc! < new Date(),
      nextPlannedLocationLabel: nextPlanFamilyLabel
        ? `${nextPlanFamilyLabel}${nextPlanDate}`
        : 'No upcoming plans',
      personLabel:
        personLabel(assignment.partneringFamilyPersonId) ?? 'Unknown Person',
      startedLabel: formatDate(assignment.startedAtUtc),
      status: assignmentStatus(assignment),
      typeLabel: assignment.arrangementType || '-',
    };
  });
}

export function allArrangements(
  partneringFamilyInfo: CombinedFamilyInfo['partneringFamilyInfo']
) {
  const closedV1CaseArrangements =
    partneringFamilyInfo?.closedV1Cases?.flatMap(
      (v1Case) =>
        v1Case.arrangements?.map((arrangement) => ({
          referralId: v1Case.id!,
          arrangement,
        })) ?? []
    ) ?? [];

  const openV1CaseArrangements =
    partneringFamilyInfo?.openV1Case?.arrangements?.map((arrangement) => ({
      referralId: partneringFamilyInfo.openV1Case!.id!,
      arrangement,
    })) ?? [];

  return [...closedV1CaseArrangements, ...openV1CaseArrangements];
}
