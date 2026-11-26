import {
  ApprovalRenewalRoleScope,
  DisclosedApprovalRenewalState,
  type DisclosedApprovalRenewalRole,
} from '../GeneratedClient.ts';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import type { ApprovalRenewalWorkItem } from './approvalRenewalWorkQueue';
import {
  approvalExpirationWindow,
  selectDashboardApprovalExpirations,
} from './dashboardApprovalExpirations.ts';
import type { RequirementWindowDays } from './dashboardPreferences';

type ApprovalTarget = ApprovalExpirationWorkItem['target'];
type RenewalRow = ApprovalRenewalWorkItem & {
  renderKey: string;
  dateReached: boolean;
};

function roleTarget(
  target: ApprovalTarget,
  role: DisclosedApprovalRenewalRole
): ApprovalTarget | undefined {
  switch (role.scope) {
    case ApprovalRenewalRoleScope.Family:
      return target.kind === 'organization'
        ? undefined
        : { kind: 'family', familyId: target.familyId };
    case ApprovalRenewalRoleScope.Individual:
      return target.kind === 'individual' ? target : undefined;
    case ApprovalRenewalRoleScope.Organization:
      return target.kind === 'organization' ? target : undefined;
  }
}

function relationshipKey(
  { organizationId, locationId }: ApprovalExpirationWorkItem['scope'],
  target: ApprovalTarget,
  roleName: string,
  date: string
) {
  return JSON.stringify([
    organizationId,
    locationId,
    target.kind,
    target.kind === 'organization' ? target.communityId : target.familyId,
    target.kind === 'individual' ? target.familyMemberId : null,
    roleName,
    date,
  ]);
}

export function affectedApprovalRoleLabel(role: DisclosedApprovalRenewalRole) {
  const labels = {
    [ApprovalRenewalRoleScope.Family]: 'Family',
    [ApprovalRenewalRoleScope.Individual]: 'Individual',
    [ApprovalRenewalRoleScope.Organization]: 'Organization',
  };
  return `${labels[role.scope]}: ${role.roleName}`;
}

export function selectDashboardApprovalWork(
  approvals: readonly ApprovalExpirationWorkItem[],
  renewals: readonly ApprovalRenewalWorkItem[],
  evaluationTime: Date,
  days: RequirementWindowDays
) {
  const { today, lastDay } = approvalExpirationWindow(evaluationTime, days);
  const occurrences = new Map<string, number>();
  const upcoming: RenewalRow[] = [];
  const uncovered: RenewalRow[] = [];
  const relationships = new Map<string, ApprovalRenewalWorkItem[]>();

  for (const renewal of renewals) {
    const occurrence = occurrences.get(renewal.candidateKey) ?? 0;
    occurrences.set(renewal.candidateKey, occurrence + 1);
    const isUncovered =
      renewal.state === DisclosedApprovalRenewalState.Uncovered;
    if (!isUncovered && renewal.firstUncoveredOnUtc > lastDay) continue;

    const row = {
      ...renewal,
      renderKey: JSON.stringify([renewal.candidateKey, occurrence]),
      dateReached: !isUncovered && renewal.firstUncoveredOnUtc <= today,
    };
    (isUncovered ? uncovered : upcoming).push(row);

    const keys = new Set<string>();
    for (const role of renewal.affectedRoles) {
      const target = roleTarget(renewal.target, role);
      if (target)
        keys.add(
          relationshipKey(
            renewal.scope,
            target,
            role.roleName,
            renewal.firstUncoveredOnUtc
          )
        );
    }
    for (const key of keys) {
      const related = relationships.get(key);
      if (related) related.push(renewal);
      else relationships.set(key, [renewal]);
    }
  }

  const expiring = selectDashboardApprovalExpirations(
    approvals,
    evaluationTime,
    days
  ).map((approval) => ({
    ...approval,
    relatedRenewals:
      relationships.get(
        relationshipKey(
          approval.scope,
          approval.target,
          approval.roleName,
          approval.expirationDate
        )
      ) ?? [],
  }));
  const expired = approvals.filter(({ status }) => status === 'expired');
  return { upcoming, uncovered, expiring, expired };
}
