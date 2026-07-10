import { ArrangementEntry, CombinedFamilyInfo } from '../../GeneratedClient';

export type AssignmentFilterValue = 'assigned' | 'unassigned';

export type AssignmentFilterSelectionsByArrangementType = Record<
  string,
  AssignmentFilterValue[]
>;

function assignmentIsCurrent(assignment: ArrangementEntry) {
  return !assignment.endedAtUtc && !assignment.cancelledAtUtc;
}

function assignmentFilterValueForArrangementType(
  family: CombinedFamilyInfo,
  arrangementType: string
): AssignmentFilterValue {
  const hasCurrentAssignment = family.volunteerFamilyInfo?.assignments?.some(
    (assignment) =>
      assignment.arrangementType === arrangementType &&
      assignmentIsCurrent(assignment)
  );

  return hasCurrentAssignment ? 'assigned' : 'unassigned';
}

export function matchesAssignmentFilters(
  family: CombinedFamilyInfo,
  selectedValuesByArrangementType: AssignmentFilterSelectionsByArrangementType
) {
  return Object.entries(selectedValuesByArrangementType).every(
    ([arrangementType, selectedValues]) => {
      if (selectedValues.length === 0) {
        return true;
      }

      return selectedValues.includes(
        assignmentFilterValueForArrangementType(family, arrangementType)
      );
    }
  );
}
