import { useEffect, useMemo, useState } from 'react';
import {
  AssignedIndividualVolunteer,
  FunctionAssignmentPolicy,
} from '../GeneratedClient';
import {
  buildDraftAssignments,
  FunctionAssignmentCandidate,
  functionAssignmentChanges,
} from './functionAssignmentModel';
import { useFunctionAssignmentsViewModel } from './useFunctionAssignmentsViewModel';

type UseFunctionAssignmentsEditorViewModelParameters = {
  open: boolean;
  assignments: AssignedIndividualVolunteer[];
  policies: FunctionAssignmentPolicy[];
};

export function useFunctionAssignmentsEditorViewModel({
  open,
  assignments,
  policies,
}: UseFunctionAssignmentsEditorViewModelParameters) {
  const [draftAssignments, setDraftAssignments] = useState<
    Record<string, string | null>
  >({});
  const { getOptionsForRole, peopleById, roles } =
    useFunctionAssignmentsViewModel({
      assignments,
      policies,
    });

  useEffect(() => {
    if (!open) {
      setDraftAssignments({});
      return;
    }

    setDraftAssignments(buildDraftAssignments(assignments, roles, peopleById));
  }, [assignments, open, peopleById, roles]);

  const editorRows = useMemo(
    () =>
      roles.map((assignmentRole) => {
        const selectedPersonId = draftAssignments[assignmentRole] ?? null;
        const options = getOptionsForRole(assignmentRole, selectedPersonId);
        const selectedCandidate =
          options.find((option) => option.personId === selectedPersonId) ??
          null;

        return {
          assignmentRole,
          options,
          selectedCandidate,
        };
      }),
    [draftAssignments, getOptionsForRole, roles]
  );

  const assignmentChanges = useMemo(
    () => functionAssignmentChanges(assignments, roles, draftAssignments),
    [assignments, draftAssignments, roles]
  );

  function updateAssignment(
    assignmentRole: string,
    candidate: FunctionAssignmentCandidate | null
  ) {
    setDraftAssignments((current) => ({
      ...current,
      [assignmentRole]: candidate?.personId ?? null,
    }));
  }

  return {
    assignmentChanges,
    canSave: true,
    editorRows,
    updateAssignment,
  };
}
