import { useMemo } from 'react';
import {
  AssignedIndividualVolunteer,
  FunctionAssignmentPolicy,
} from '../GeneratedClient';
import { useVisibleFamilies } from '../Model/Data';
import {
  assignmentCandidateForPerson,
  buildCandidatesByRole,
  buildPeopleById,
  functionAssignmentRoles,
  sortAssignmentsByPersonName,
  sortCandidatesForAutocomplete,
} from './functionAssignmentModel';

type UseFunctionAssignmentsViewModelParameters = {
  assignments: AssignedIndividualVolunteer[];
  policies: FunctionAssignmentPolicy[];
};

export function useFunctionAssignmentsViewModel({
  assignments,
  policies,
}: UseFunctionAssignmentsViewModelParameters) {
  const families = useVisibleFamilies();
  const roles = useMemo(
    () => functionAssignmentRoles(assignments, policies),
    [assignments, policies]
  );
  const candidatesByRole = useMemo(
    () => buildCandidatesByRole(families, policies),
    [families, policies]
  );
  const peopleById = useMemo(() => buildPeopleById(families), [families]);
  const assignedVolunteerRows = useMemo(
    () =>
      roles.map((assignmentRole) => ({
        assignmentRole,
        assignedVolunteers: sortAssignmentsByPersonName(
          assignments.filter(
            (assignment) => assignment.assignmentRole === assignmentRole
          ),
          peopleById
        ),
      })),
    [assignments, peopleById, roles]
  );

  function getOptionsForRole(
    assignmentRole: string,
    selectedPersonId: string | null | undefined
  ) {
    const options = candidatesByRole.get(assignmentRole) ?? [];
    if (
      !selectedPersonId ||
      options.some((option) => option.personId === selectedPersonId)
    ) {
      return sortCandidatesForAutocomplete(options);
    }

    return sortCandidatesForAutocomplete(
      options.concat(assignmentCandidateForPerson(selectedPersonId, peopleById))
    );
  }

  return {
    assignedVolunteerRows,
    candidatesByRole,
    getOptionsForRole,
    peopleById,
    roles,
  };
}
