import { format } from 'date-fns';
import {
  Arrangement,
  ArrangementFunction,
  ArrangementPhase,
  ArrangementPolicy,
  CombinedFamilyInfo,
  FamilyVolunteerAssignment,
  FunctionRequirement,
  IndividualVolunteerAssignment,
  V1Case,
} from '../../GeneratedClient';
import { personNameString } from '../../Families/PersonName';

export type ArrangementFunctionSummaryV2 = {
  functionName: string;
  requirementLabel: string;
  statusLabel: string;
  assignmentLabels: string[];
  assignments: Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>;
  missingVariantLabels: string[];
  functionPolicy: ArrangementFunction;
};

export type ArrangementRowV2 = {
  id: string;
  arrangementType: string;
  caseLabel?: string;
  familyLabel?: string;
  childOrPersonLabel?: string;
  hostFamilyLabel?: string;
  volunteerLabel?: string;
  statusLabel: string;
  requestedDate?: string;
  startedDate?: string;
  endedDate?: string;
  cancelledDate?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  currentLocationLabel?: string;
  nextPlannedLocationLabel?: string;
  reason?: string;
  comments?: string;
  functionSummaries: ArrangementFunctionSummaryV2[];
  source: Arrangement;
  arrangementPolicy?: ArrangementPolicy;
  partneringFamily: CombinedFamilyInfo;
  v1Case: V1Case;
};

type BuildArrangementRowsV2Parameters = {
  arrangements: Arrangement[];
  arrangementPolicies?: ArrangementPolicy[];
  family: CombinedFamilyInfo;
  v1Case: V1Case;
  personLabel: (familyId: string | undefined, personId: string | undefined) => string;
  familyLabel: (familyId: string | undefined) => string;
};

function arrangementPhaseLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Started';
  if (phase === ArrangementPhase.Ended) return 'Ended';
  if (phase === ArrangementPhase.Cancelled) return 'Cancelled';
  return 'Unknown';
}

function caseLabel(v1Case: V1Case) {
  if (v1Case.closedAtUtc) {
    return `Closed ${formatDate(v1Case.closedAtUtc)}`;
  }

  if (v1Case.openedAtUtc) {
    return `Open since ${formatDate(v1Case.openedAtUtc)}`;
  }

  return 'Case';
}

function formatDate(date?: Date) {
  return date ? format(date, 'M/d/yyyy') : undefined;
}

function functionRequirementLabel(requirement?: FunctionRequirement) {
  if (requirement === FunctionRequirement.ZeroOrMore) return 'Optional';
  if (requirement === FunctionRequirement.ExactlyOne) return 'Exactly one';
  if (requirement === FunctionRequirement.OneOrMore) return 'One or more';
  return 'Unknown';
}

function familyNameString(family: CombinedFamilyInfo) {
  const primaryContactPerson = family.family?.adults?.find(
    (adult) => adult.item1?.id === family.family?.primaryFamilyContactPersonId
  )?.item1;

  return primaryContactPerson
    ? `${personNameString(primaryContactPerson)} Family`
    : 'Family';
}

function currentLocationLabel(
  arrangement: Arrangement,
  familyLabel: BuildArrangementRowsV2Parameters['familyLabel']
) {
  const currentLocation =
    arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
      ? arrangement.childLocationHistory[
          arrangement.childLocationHistory.length - 1
        ]
      : undefined;

  return currentLocation
    ? familyLabel(currentLocation.childLocationFamilyId)
    : undefined;
}

function nextPlannedLocationLabel(
  arrangement: Arrangement,
  familyLabel: BuildArrangementRowsV2Parameters['familyLabel']
) {
  const currentLocation =
    arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
      ? arrangement.childLocationHistory[
          arrangement.childLocationHistory.length - 1
        ]
      : undefined;
  const nextPlannedLocation =
    arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
      ? arrangement.childLocationPlan.find(
          (entry) =>
            currentLocation == null ||
            (entry.timestampUtc! > currentLocation.timestampUtc! &&
              entry.childLocationFamilyId !==
                currentLocation.childLocationFamilyId)
        ) ||
        arrangement.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !== currentLocation?.childLocationFamilyId
          )
      : undefined;

  if (!nextPlannedLocation) {
    return undefined;
  }

  return `${familyLabel(nextPlannedLocation.childLocationFamilyId)} on ${formatDate(
    nextPlannedLocation.timestampUtc
  )}`;
}

function isIndividualAssignment(
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
): assignment is IndividualVolunteerAssignment {
  return 'personId' in assignment;
}

function assignmentLabel(
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment,
  personLabel: BuildArrangementRowsV2Parameters['personLabel'],
  familyLabel: BuildArrangementRowsV2Parameters['familyLabel']
) {
  if (isIndividualAssignment(assignment)) {
    return personLabel(assignment.familyId, assignment.personId);
  }

  return familyLabel(assignment.familyId);
}

function assignmentVariantLabel(
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
) {
  return assignment.arrangementFunctionVariant
    ? ` - ${assignment.arrangementFunctionVariant}`
    : '';
}

function buildFunctionSummaries({
  arrangement,
  arrangementPolicy,
  familyLabel,
  personLabel,
}: {
  arrangement: Arrangement;
  arrangementPolicy?: ArrangementPolicy;
  familyLabel: BuildArrangementRowsV2Parameters['familyLabel'];
  personLabel: BuildArrangementRowsV2Parameters['personLabel'];
}): ArrangementFunctionSummaryV2[] {
  return (
    arrangementPolicy?.arrangementFunctions?.map((functionPolicy) => {
      const assignments = [
        ...(arrangement.familyVolunteerAssignments ?? []),
        ...(arrangement.individualVolunteerAssignments ?? []),
      ].filter(
        (assignment) =>
          assignment.arrangementFunction === functionPolicy.functionName
      );
      const assignmentLabels = assignments.map(
        (assignment) =>
          `${assignmentLabel(assignment, personLabel, familyLabel)}${assignmentVariantLabel(
            assignment
          )}`
      );
      const missingVariantLabels = assignments
        .filter(
          (assignment) =>
            functionPolicy.variants &&
            functionPolicy.variants.length > 0 &&
            !assignment.arrangementFunctionVariant
        )
        .map((assignment) => assignmentLabel(assignment, personLabel, familyLabel));

      return {
        functionName: functionPolicy.functionName,
        requirementLabel: functionRequirementLabel(functionPolicy.requirement),
        statusLabel: assignments.length > 0 ? 'Assigned' : 'Missing',
        assignmentLabels,
        assignments,
        missingVariantLabels,
        functionPolicy,
      };
    }) ?? []
  );
}

export function buildArrangementRowsV2({
  arrangements,
  arrangementPolicies,
  family,
  familyLabel,
  personLabel,
  v1Case,
}: BuildArrangementRowsV2Parameters): ArrangementRowV2[] {
  return arrangements.map((arrangement) => {
    const arrangementPolicy = arrangementPolicies?.find(
      (policy) => policy.arrangementType === arrangement.arrangementType
    );
    const individualAssignmentLabels = arrangement.individualVolunteerAssignments
      ?.map((assignment) =>
        personLabel(assignment.familyId, assignment.personId)
      )
      .filter(Boolean);
    const familyAssignmentLabels = arrangement.familyVolunteerAssignments
      ?.map((assignment) => familyLabel(assignment.familyId))
      .filter(Boolean);

    return {
      id: arrangement.id,
      arrangementType: arrangement.arrangementType || 'Arrangement',
      caseLabel: caseLabel(v1Case),
      familyLabel: familyNameString(family),
      childOrPersonLabel: personLabel(
        family.family?.id,
        arrangement.partneringFamilyPersonId
      ),
      hostFamilyLabel: currentLocationLabel(arrangement, familyLabel),
      volunteerLabel:
        [...individualAssignmentLabels, ...familyAssignmentLabels].join(', ') ||
        undefined,
      statusLabel: arrangementPhaseLabel(arrangement.phase),
      requestedDate: formatDate(arrangement.requestedAtUtc),
      startedDate: formatDate(arrangement.startedAtUtc),
      endedDate: formatDate(arrangement.endedAtUtc),
      cancelledDate: formatDate(arrangement.cancelledAtUtc),
      plannedStartDate: formatDate(arrangement.plannedStartUtc),
      plannedEndDate: formatDate(arrangement.plannedEndUtc),
      currentLocationLabel: currentLocationLabel(arrangement, familyLabel),
      nextPlannedLocationLabel: nextPlannedLocationLabel(
        arrangement,
        familyLabel
      ),
      reason: arrangement.reason,
      comments: arrangement.comments,
      functionSummaries: buildFunctionSummaries({
        arrangement,
        arrangementPolicy,
        familyLabel,
        personLabel,
      }),
      source: arrangement,
      arrangementPolicy,
      partneringFamily: family,
      v1Case,
    };
  });
}
