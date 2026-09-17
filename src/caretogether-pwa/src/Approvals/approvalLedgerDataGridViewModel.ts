import type { GridValidRowModel } from '@mui/x-data-grid-premium';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';

export const APPROVAL_LEDGER_SEARCH_FIELD = 'searchText';

export const approvalLedgerDefaultColumnFields = [
  'status',
  'requirementName',
  'appliesTo',
  'completedOrExemptedOn',
  'validUntil',
  'neededForRoles',
  'documents',
  'notes',
  'completedOrExemptedByUserId',
  'openDetails',
] as const;

export const approvalLedgerExportFields = [
  'status',
  'requirementName',
  'appliesTo',
  'completedOrExemptedOn',
  'validUntil',
  'neededForRoles',
  'documents',
  'notes',
] as const;

export type ApprovalLedgerDomainFilters = {
  appliesToFilter: string;
  roleFilter: string;
  statusFilter: ApprovalLedgerStatus | 'all';
};

export const approvalLedgerStatusLabels: Record<ApprovalLedgerStatus, string> =
  {
    missing: 'Missing',
    optional: 'Optional',
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
    case 'optional':
      return 'info';
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
    row.requirementName,
    ...row.appliesTo.map((subject) => subject.label),
    ...row.neededForRoleLabels,
    ...row.neededForRoles,
    ...row.notes,
  ].join('\n');
}

export function approvalLedgerQuickFilterParser(input: string) {
  const searchText = input.trim();
  return searchText ? [searchText] : [];
}

export function filterApprovalLedgerRows(
  rows: ApprovalLedgerRow[],
  { appliesToFilter, roleFilter, statusFilter }: ApprovalLedgerDomainFilters
) {
  return rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) {
      return false;
    }

    if (roleFilter !== 'all' && !row.neededForRoles.includes(roleFilter)) {
      return false;
    }

    return (
      appliesToFilter === 'all' ||
      row.appliesTo.some(
        (subject) => subjectKey(subject.scope, subject.id) === appliesToFilter
      )
    );
  });
}

export function approvalLedgerMemberGroupingKey(row: ApprovalLedgerRow) {
  const subject = row.appliesTo[0];
  return subject ? subjectKey(subject.scope, subject.id) : 'unassigned';
}

export function compareApprovalLedgerMemberKeys(
  memberLabels: Map<string, string>,
  firstKey: string,
  secondKey: string
) {
  const memberRank = (key: string) => {
    if (!memberLabels.has(key)) return 2;
    if (key.startsWith('family:')) return 0;
    return key.startsWith('person:') ? 1 : 2;
  };
  const rank = memberRank(firstKey) - memberRank(secondKey);
  if (rank) return rank;

  const labelOrder = (memberLabels.get(firstKey) ?? 'Unassigned').localeCompare(
    memberLabels.get(secondKey) ?? 'Unassigned'
  );
  return labelOrder || firstKey.localeCompare(secondKey);
}

export function isApprovalLedgerLeafRowNode(
  rowNode: { type?: string } | null | undefined
) {
  return rowNode?.type === 'leaf';
}

export type ApprovalLedgerDataGridRowV2 = ApprovalLedgerRow & GridValidRowModel;
