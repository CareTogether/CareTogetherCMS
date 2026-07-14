import { GridValidRowModel } from '@mui/x-data-grid';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';

export const approvalLedgerStatusLabels: Record<ApprovalLedgerStatus, string> =
  {
    missing: 'Missing',
    completed: 'Completed',
    exempted: 'Exempted',
    expiring: 'Expiring',
    expired: 'Expired',
    availableApplication: 'Application',
  };

export function approvalLedgerStatusColor(status: ApprovalLedgerStatus) {
  switch (status) {
    case 'expired':
      return 'warning';
    case 'missing':
      return 'error';
    case 'expiring':
      return 'warning';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

export function countLabel(count: number, singular: string, plural: string) {
  if (count === 0) {
    return '-';
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatApprovalLedgerDate(date?: Date) {
  return date ? formatUtcDateOnly(date) : '-';
}

export function subjectKey(scope: string, id: string) {
  return `${scope}:${id}`;
}

export function approvalLedgerSearchText(row: ApprovalLedgerRow) {
  return [
    approvalLedgerStatusLabels[row.status],
    row.requirementName,
    ...row.appliesTo.map((subject) => subject.label),
    formatApprovalLedgerDate(row.completedOrExemptedOn),
    formatApprovalLedgerDate(row.validUntil),
    ...row.neededForRoleLabels,
    ...row.neededForRoles,
    countLabel(row.linkedDocumentIds.length, 'document', 'documents'),
    countLabel(row.noteIds.length + row.notes.length, 'note', 'notes'),
    ...row.notes,
  ].join(' ');
}

export type ApprovalLedgerDataGridRowV2 = ApprovalLedgerRow &
  GridValidRowModel;
