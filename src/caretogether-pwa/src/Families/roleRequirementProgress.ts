import type { ApprovalLedgerStatus } from '../Approvals/approvalLedgerViewModel';

const doneStatuses: ApprovalLedgerStatus[] = [
  'completed',
  'exempted',
  'expiring',
];

/**
 * Progress across every requirement a role drawer shows: the family-level
 * ones and each adult's. Optional requirements are left out of the total.
 */
export function roleRequirementProgress(
  requirements: { status: ApprovalLedgerStatus }[]
) {
  const counted = requirements.filter(
    (requirement) => requirement.status !== 'optional'
  );
  const done = counted.filter((requirement) =>
    doneStatuses.includes(requirement.status)
  ).length;
  const total = counted.length;

  return {
    done,
    total,
    percentage: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
