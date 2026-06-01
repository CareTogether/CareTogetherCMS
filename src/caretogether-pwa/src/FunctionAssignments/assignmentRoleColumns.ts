import { AssignedIndividualVolunteer, Person } from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';

export function assignmentRolesForColumns(
  policyRoles: (string | undefined)[],
  assignments: AssignedIndividualVolunteer[]
) {
  const configuredRoles = policyRoles.filter((role): role is string =>
    Boolean(role)
  );
  const assignedRoles = assignments
    .map((assignment) => assignment.assignmentRole)
    .filter((role) => role && !configuredRoles.includes(role));

  return Array.from(new Set(configuredRoles.concat(assignedRoles)));
}

export function assignmentNamesForRole(
  assignments: AssignedIndividualVolunteer[],
  assignmentRole: string,
  personLookup: (personId: string) => Person | undefined
) {
  return assignments
    .filter((assignment) => assignment.assignmentRole === assignmentRole)
    .map((assignment) => personNameString(personLookup(assignment.personId)))
    .sort((a, b) => a.localeCompare(b))
    .join(', ');
}

export type AssignmentFilterSelectionsByRole = Record<
  string,
  (string | null)[]
>;

export function matchesAssignmentFilters(
  assignments: AssignedIndividualVolunteer[],
  selectedValuesByRole: AssignmentFilterSelectionsByRole
) {
  return Object.entries(selectedValuesByRole).every(
    ([assignmentRole, selectedValues]) => {
      if (selectedValues.length === 0) return true;

      const assignedPersonIds = assignments
        .filter((assignment) => assignment.assignmentRole === assignmentRole)
        .map((assignment) => assignment.personId);

      if (assignedPersonIds.length === 0) {
        return selectedValues.includes(null);
      }

      return assignedPersonIds.some((personId) =>
        selectedValues.includes(personId)
      );
    }
  );
}
