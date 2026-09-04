import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
} from './approvalLedgerViewModel';

export type ApprovalRequirementManagementMode =
  | 'complete'
  | 'grantExemption'
  | 'markIncomplete'
  | 'removeExemption';

export function findActionableApprovalOccurrence(
  row: ApprovalLedgerRow | null
): ApprovalLedgerOccurrence | undefined {
  return row?.occurrences.find(
    ({ status }) =>
      status === 'missing' ||
      status === 'availableApplication' ||
      status === 'completed' ||
      status === 'exempted'
  );
}
