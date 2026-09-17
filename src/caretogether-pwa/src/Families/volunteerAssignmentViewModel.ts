import { format } from 'date-fns';
import { ArrangementEntry, CombinedFamilyInfo } from '../GeneratedClient';

export type AssignmentBrowserStatus =
  | 'cancelled'
  | 'ended'
  | 'active'
  | 'pending';

export type AssignmentBrowserStatusPresentation = {
  color: 'default' | 'success' | 'info' | 'warning';
  label: 'Cancelled' | 'Ended' | 'Active' | 'Pending';
};

export type AssignmentBrowserRowV2 = {
  arrangementPolicyVersion: string | null;
  arrangementType: string;
  cancelledAtUtc: Date | null;
  childFamilyId: string | null;
  childFamilyLabel: string | null;
  currentLocationFamilyId: string | null;
  currentLocationLabel: string | null;
  endedAtUtc: Date | null;
  id: string;
  nextPlanIsPastDue: boolean;
  nextPlannedLocationAtUtc: Date | null;
  nextPlannedLocationFamilyId: string | null;
  nextPlannedLocationLabel: string | null;
  partneringFamilyPersonId: string;
  personLabel: string | null;
  requestedAtUtc: Date | null;
  searchableText: string;
  source: ArrangementEntry;
  startedAtUtc: Date | null;
  status: AssignmentBrowserStatus;
};

type BuildVolunteerAssignmentRowsV2Parameters = {
  assignments: ArrangementEntry[];
  childFamilyIdForAssignment: (
    assignment: ArrangementEntry
  ) => string | undefined;
  familyLabel: (familyId: string | undefined) => string | undefined;
  personLabel: (personId: string | undefined) => string | undefined;
};

export function assignmentBrowserStatus(
  assignment: ArrangementEntry
): AssignmentBrowserStatus {
  if (assignment.cancelledAtUtc) return 'cancelled';
  if (assignment.endedAtUtc) return 'ended';
  if (assignment.active) return 'active';
  return 'pending';
}

export function assignmentBrowserStatusPresentation(
  status: AssignmentBrowserStatus
): AssignmentBrowserStatusPresentation {
  if (status === 'cancelled') return { label: 'Cancelled', color: 'default' };
  if (status === 'ended') return { label: 'Ended', color: 'success' };
  if (status === 'active') return { label: 'Active', color: 'info' };
  return { label: 'Pending', color: 'warning' };
}

export function assignmentTypeLabel(arrangementType: string) {
  return arrangementType || '-';
}

export function assignmentPersonLabel(personLabel: string | null) {
  return personLabel ?? 'Unknown Person';
}

export function assignmentCurrentLocationLabel(locationLabel: string | null) {
  return locationLabel ?? 'Location Unspecified';
}

export function assignmentNextPlannedLocationLabel(
  locationLabel: string | null,
  nextPlannedLocationAtUtc: Date | null
) {
  if (!locationLabel) return 'No upcoming plans';
  const dateSuffix = nextPlannedLocationAtUtc
    ? ` on ${format(nextPlannedLocationAtUtc, 'M/d/yyyy')}`
    : '';
  return `${locationLabel}${dateSuffix}`;
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
}: BuildVolunteerAssignmentRowsV2Parameters): AssignmentBrowserRowV2[] {
  return assignments.map((assignment) => {
    const childFamilyId = childFamilyIdForAssignment(assignment) ?? null;
    const currentLocationFamilyId = currentLocationId(assignment) ?? null;
    const nextPlan = nextPlannedLocation(assignment);
    const nextPlannedLocationFamilyId = nextPlan?.childLocationFamilyId ?? null;
    const nextPlannedLocationAtUtc = nextPlan?.timestampUtc ?? null;
    const currentLocationLabel =
      familyLabel(currentLocationFamilyId ?? undefined) ?? null;
    const nextPlannedLocationLabel =
      familyLabel(nextPlannedLocationFamilyId ?? undefined) ?? null;
    const resolvedPersonLabel =
      personLabel(assignment.partneringFamilyPersonId) ?? null;
    const status = assignmentBrowserStatus(assignment);

    return {
      id: assignment.id,
      arrangementPolicyVersion: assignment.arrangementPolicyVersion ?? null,
      arrangementType: assignment.arrangementType,
      cancelledAtUtc: assignment.cancelledAtUtc ?? null,
      childFamilyId,
      childFamilyLabel: familyLabel(childFamilyId ?? undefined) ?? null,
      currentLocationFamilyId,
      currentLocationLabel,
      endedAtUtc: assignment.endedAtUtc ?? null,
      nextPlanIsPastDue:
        nextPlan !== undefined && nextPlan.timestampUtc! < new Date(),
      nextPlannedLocationAtUtc,
      nextPlannedLocationFamilyId,
      nextPlannedLocationLabel,
      partneringFamilyPersonId: assignment.partneringFamilyPersonId,
      personLabel: resolvedPersonLabel,
      requestedAtUtc: assignment.requestedAtUtc ?? null,
      searchableText: [
        assignmentTypeLabel(assignment.arrangementType),
        assignmentPersonLabel(resolvedPersonLabel),
        assignmentBrowserStatusPresentation(status).label,
        assignmentCurrentLocationLabel(currentLocationLabel),
        assignmentNextPlannedLocationLabel(
          nextPlannedLocationLabel,
          nextPlannedLocationAtUtc
        ),
      ].join('\n'),
      source: assignment,
      startedAtUtc: assignment.startedAtUtc ?? null,
      status,
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
