import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from './approvalLedgerViewModel';

export type ApprovalLedgerStatusChipColor =
  | 'default'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export type ApprovalLedgerStatusRow = {
  status: ApprovalLedgerStatus;
  validUntil?: Date;
  occurrences: Pick<ApprovalLedgerOccurrence, 'status'>[];
};

export type ApprovalLedgerStatusPresentation = {
  /** The record's own status: an expired completion still reads "Completed". */
  recordStatus: Exclude<ApprovalLedgerStatus, 'expired'>;
  label: string;
  color: ApprovalLedgerStatusChipColor;
  /** Outlined marks a past (expired) record; current records are filled. */
  variant: 'filled' | 'outlined';
  /** Set only when the completion or exemption has expired. */
  expiredOn?: Date;
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

export function approvalLedgerStatusColor(
  status: ApprovalLedgerStatus
): ApprovalLedgerStatusChipColor {
  switch (status) {
    case 'missing':
      return 'error';
    case 'expiring':
      return 'warning';
    case 'optional':
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'expired':
    case 'exempted':
    default:
      return 'default';
  }
}

function expiredRecordStatus(row: ApprovalLedgerStatusRow) {
  return row.occurrences.some((occurrence) => occurrence.status === 'exempted')
    ? 'exempted'
    : 'completed';
}

/**
 * An expired completion or exemption is history, not an action item: the
 * requirement shows up as missing on its own when it is no longer met. So it
 * keeps its completed/exempted label in an outlined chip, and the expiry date
 * is shown where the record's dates already are.
 */
export function approvalLedgerStatusPresentation(
  row: ApprovalLedgerStatusRow
): ApprovalLedgerStatusPresentation {
  if (row.status !== 'expired') {
    return {
      recordStatus: row.status,
      label: approvalLedgerStatusLabels[row.status],
      color: approvalLedgerStatusColor(row.status),
      variant: 'filled',
    };
  }

  const recordStatus = expiredRecordStatus(row);

  return {
    recordStatus,
    label: approvalLedgerStatusLabels[recordStatus],
    color: approvalLedgerStatusColor(recordStatus),
    variant: 'outlined',
    expiredOn: row.validUntil,
  };
}

/** Plain-text status for grid sorting, filtering and export. */
export function approvalLedgerStatusText(row: ApprovalLedgerStatusRow) {
  const presentation = approvalLedgerStatusPresentation(row);

  if (row.status !== 'expired') {
    return presentation.label;
  }

  return `${presentation.label} (expired)`;
}

type ApprovalAttentionRow = Pick<
  ApprovalLedgerRow,
  'status' | 'requirementName' | 'appliesTo'
>;

const CURRENT_RECORD_STATUSES = new Set<ApprovalLedgerStatus>([
  'completed',
  'exempted',
  'expiring',
]);

function attentionKey(row: ApprovalAttentionRow) {
  const subject = row.appliesTo[0];
  return [subject?.scope, subject?.id, row.requirementName].join('|');
}

/**
 * Counts for the Approvals tab badges. An expired record counts only when the
 * same person or family has no current completion or exemption of that
 * requirement, so a renewed check no longer shows up as expired.
 */
export function approvalAttentionCounts(rows: ApprovalAttentionRow[]) {
  const renewedKeys = new Set(
    rows
      .filter((row) => CURRENT_RECORD_STATUSES.has(row.status))
      .map(attentionKey)
  );

  return {
    missing: rows.filter((row) => row.status === 'missing').length,
    expired: rows.filter(
      (row) => row.status === 'expired' && !renewedKeys.has(attentionKey(row))
    ).length,
  };
}
