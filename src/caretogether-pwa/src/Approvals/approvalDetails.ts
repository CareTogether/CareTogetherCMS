import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
} from './approvalLedgerViewModel';
import type {
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
} from '../GeneratedClient';

export type ApprovalRequirementManagementMode =
  | 'complete'
  | 'grantExemption'
  | 'markIncomplete'
  | 'removeExemption';

export const approvalRequirementManagementTitles: Record<
  ApprovalRequirementManagementMode,
  string
> = {
  complete: 'Complete',
  grantExemption: 'Exempt',
  markIncomplete: 'Mark Incomplete',
  removeExemption: 'Remove Exemption',
};

export function approvalRequirementName(
  occurrence: ApprovalLedgerOccurrence | undefined
) {
  if (!occurrence) return '';
  if (typeof occurrence.requirement === 'string') {
    return occurrence.requirement;
  }
  if ('actionName' in occurrence.requirement) {
    return occurrence.requirement.actionName ?? '';
  }
  return occurrence.requirement.requirementName;
}

export function isCompletedApprovalOccurrence(
  occurrence: ApprovalLedgerOccurrence | undefined
): occurrence is ApprovalLedgerOccurrence & {
  requirement: CompletedRequirementInfo;
} {
  return Boolean(
    occurrence &&
      typeof occurrence.requirement !== 'string' &&
      'completedRequirementId' in occurrence.requirement &&
      'completedAtUtc' in occurrence.requirement
  );
}

export function isExemptedApprovalOccurrence(
  occurrence: ApprovalLedgerOccurrence | undefined
): occurrence is ApprovalLedgerOccurrence & {
  requirement: ExemptedRequirementInfo;
} {
  return Boolean(
    occurrence &&
      typeof occurrence.requirement !== 'string' &&
      'additionalComments' in occurrence.requirement &&
      'timestampUtc' in occurrence.requirement
  );
}

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
