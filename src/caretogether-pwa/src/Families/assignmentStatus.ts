import { ArrangementEntry } from '../GeneratedClient';

export type AssignmentStatus = 'Setup' | 'Active' | 'Completed' | 'Canceled';

export interface AssignmentStatusDisplay {
  label: AssignmentStatus;
  color: string;
  progressWidth: string;
}

type AssignmentStatusSource = Pick<
  ArrangementEntry,
  'active' | 'startedAtUtc' | 'endedAtUtc' | 'cancelledAtUtc'
>;

export const assignmentStatusColorMap: Record<AssignmentStatus, string> = {
  Setup: '#E3AE01',
  Active: '#E3AE01',
  Completed: '#2E7D32',
  Canceled: '#9E9E9E',
};

export function getAssignmentStatus(
  assignment: AssignmentStatusSource
): AssignmentStatusDisplay {
  if (assignment.cancelledAtUtc) {
    return {
      label: 'Canceled',
      color: assignmentStatusColorMap.Canceled,
      progressWidth: '100%',
    };
  }

  if (assignment.endedAtUtc) {
    return {
      label: 'Completed',
      color: assignmentStatusColorMap.Completed,
      progressWidth: '100%',
    };
  }

  if (assignment.active || assignment.startedAtUtc) {
    return {
      label: 'Active',
      color: assignmentStatusColorMap.Active,
      progressWidth: '50%',
    };
  }

  return {
    label: 'Setup',
    color: assignmentStatusColorMap.Setup,
    progressWidth: '50%',
  };
}
