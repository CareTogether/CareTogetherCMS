import type { ApprovalAttentionCounts } from './ApprovalTabLabel';

export function approvalMobileTabLabel(
  label: string,
  counts: ApprovalAttentionCounts
) {
  const details = [
    counts.missing > 0 ? `${counts.missing} missing` : null,
    counts.expired > 0 ? `${counts.expired} expired` : null,
  ].filter(Boolean);

  return details.length === 0 ? label : `${label} (${details.join(', ')})`;
}
