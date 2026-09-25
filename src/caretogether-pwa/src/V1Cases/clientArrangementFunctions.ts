import type {
  Arrangement,
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
} from '../GeneratedClient';
import { resolveArrangementPolicy } from './Arrangements/arrangementPolicyVersions';

export const CLIENT_ARRANGEMENT_ASSIGNMENT_FILTER_FIELD =
  'arrangementAssignment';

export type ClientArrangementFunctionAssignmentV2 = {
  arrangementId: string;
  arrangementType: string;
  arrangementPolicyVersion: string | null;
  functionName: string;
  assignmentId: string | null;
  assignmentLabel: string | null;
};

export type ClientArrangementAssignmentFilterValue = {
  arrangementType?: string;
  arrangementPolicyVersion?: string;
  functionName?: string;
  assignmentId?: string;
};

function isIndividualAssignment(
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
): assignment is IndividualVolunteerAssignment {
  return 'personId' in assignment;
}

export function clientArrangementFunctionAssignmentsFor(
  arrangements: Arrangement[],
  arrangementPolicies: Parameters<typeof resolveArrangementPolicy>[0],
  personLabel: (familyId: string, personId: string) => string,
  familyLabel: (familyId: string) => string
): ClientArrangementFunctionAssignmentV2[] {
  return arrangements.flatMap((arrangement) => {
    const assignments = [
      ...(arrangement.familyVolunteerAssignments ?? []),
      ...(arrangement.individualVolunteerAssignments ?? []),
    ];
    const policy = resolveArrangementPolicy(arrangementPolicies, arrangement);
    const functionNames = Array.from(
      new Set([
        ...(policy?.arrangementFunctions?.map(
          (arrangementFunction) => arrangementFunction.functionName
        ) ?? []),
        ...assignments.map((assignment) => assignment.arrangementFunction),
      ])
    );
    const arrangementType = arrangement.arrangementType || 'Arrangement';
    const arrangementPolicyVersion =
      arrangement.arrangementPolicyVersion ?? null;

    return functionNames.flatMap<ClientArrangementFunctionAssignmentV2>(
      (functionName) => {
        const functionAssignments = assignments.filter(
          (assignment) => assignment.arrangementFunction === functionName
        );
        const base = {
          arrangementId: arrangement.id,
          arrangementType,
          arrangementPolicyVersion,
          functionName,
        };

        if (functionAssignments.length === 0) {
          return [{ ...base, assignmentId: null, assignmentLabel: null }];
        }

        return functionAssignments.map((assignment) =>
          isIndividualAssignment(assignment)
            ? {
                ...base,
                assignmentId: `person:${assignment.familyId}:${assignment.personId}`,
                assignmentLabel: personLabel(
                  assignment.familyId,
                  assignment.personId
                ),
              }
            : {
                ...base,
                assignmentId: `family:${assignment.familyId}`,
                assignmentLabel: familyLabel(assignment.familyId),
              }
        );
      }
    );
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function clientArrangementAssignmentFilterValue(
  value: unknown
): ClientArrangementAssignmentFilterValue | null {
  if (!isRecord(value)) return null;

  const filterValue: ClientArrangementAssignmentFilterValue = {};
  if (typeof value.arrangementType === 'string')
    filterValue.arrangementType = value.arrangementType;
  if (typeof value.arrangementPolicyVersion === 'string')
    filterValue.arrangementPolicyVersion = value.arrangementPolicyVersion;
  if (typeof value.functionName === 'string')
    filterValue.functionName = value.functionName;
  if (typeof value.assignmentId === 'string')
    filterValue.assignmentId = value.assignmentId;

  return Object.keys(filterValue).length > 0 ? filterValue : null;
}

export function matchesClientArrangementAssignmentFilter(
  assignments: ClientArrangementFunctionAssignmentV2[],
  value: ClientArrangementAssignmentFilterValue
) {
  return assignments.some(
    (assignment) =>
      (!value.arrangementType ||
        assignment.arrangementType === value.arrangementType) &&
      (!value.arrangementPolicyVersion ||
        assignment.arrangementPolicyVersion ===
          value.arrangementPolicyVersion) &&
      (!value.functionName || assignment.functionName === value.functionName) &&
      (!value.assignmentId || assignment.assignmentId === value.assignmentId)
  );
}
