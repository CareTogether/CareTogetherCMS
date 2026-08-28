import { FunctionAssignmentChange } from './functionAssignmentModel';

type UseFunctionAssignmentCommandsParameters = {
  onAssign: (personId: string, assignmentRole: string) => Promise<void>;
  onUnassign: (personId: string, assignmentRole: string) => Promise<void>;
};

export function useFunctionAssignmentCommands({
  onAssign,
  onUnassign,
}: UseFunctionAssignmentCommandsParameters) {
  async function applyFunctionAssignmentChanges(
    changes: FunctionAssignmentChange[]
  ) {
    for (const change of changes) {
      if (change.kind === 'unassign') {
        await onUnassign(change.personId, change.assignmentRole);
      } else {
        await onAssign(change.personId, change.assignmentRole);
      }
    }
  }

  return {
    applyFunctionAssignmentChanges,
  };
}
