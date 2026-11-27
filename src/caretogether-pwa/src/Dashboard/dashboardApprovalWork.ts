import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import {
  approvalExpirationWindow,
  selectDashboardApprovalExpirations,
} from './dashboardApprovalExpirations.ts';
import type { RequirementWindowDays } from './dashboardPreferences';
import type {
  ExpiringRequirementRole,
  ExpiringRequirementWorkItem,
} from './expiringRequirementWorkQueue';

type ApprovalTarget = ApprovalExpirationWorkItem['target'];

function roleTarget(
  target: ApprovalTarget,
  role: ExpiringRequirementRole
): ApprovalTarget | undefined {
  switch (role.scope) {
    case 'family':
      return target.kind === 'organization'
        ? undefined
        : { kind: 'family', familyId: target.familyId };
    case 'individual':
      return target.kind === 'individual' ? target : undefined;
    case 'organization':
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

export function affectedApprovalRoleLabel(role: ExpiringRequirementRole) {
  const labels = {
    family: 'Family',
    individual: 'Individual',
    organization: 'Organization',
  };
  return `${labels[role.scope]}: ${role.roleName}`;
}

function firstDayOfWindow(today: string, days: RequirementWindowDays) {
  const first = new Date(today);
  first.setUTCDate(first.getUTCDate() - days);
  return first.toISOString().slice(0, 10);
}

/**
 * Splits approval work into the dashboard's groups for the selected window:
 * requirements that expire in the next `days` days or expired in the last
 * `days` days, and role approvals that are expiring or expired. An expiring
 * approval lists the requirements that expire on the same day for that role.
 */
export function selectDashboardApprovalWork(
  approvals: readonly ApprovalExpirationWorkItem[],
  requirements: readonly ExpiringRequirementWorkItem[],
  evaluationTime: Date,
  days: RequirementWindowDays
) {
  const { today, lastDay } = approvalExpirationWindow(evaluationTime, days);
  const firstDay = firstDayOfWindow(today, days);
  const expiringRequirements: ExpiringRequirementWorkItem[] = [];
  const expiredRequirements: ExpiringRequirementWorkItem[] = [];
  const relationships = new Map<string, ExpiringRequirementWorkItem[]>();

  for (const requirement of requirements) {
    const { expirationDate } = requirement;
    if (expirationDate > today && expirationDate <= lastDay)
      expiringRequirements.push(requirement);
    else if (expirationDate <= today && expirationDate > firstDay)
      expiredRequirements.push(requirement);
    else continue;

    const keys = new Set<string>();
    for (const role of requirement.affectedRoles) {
      const target = roleTarget(requirement.target, role);
      if (target)
        keys.add(
          relationshipKey(
            requirement.scope,
            target,
            role.roleName,
            expirationDate
          )
        );
    }
    for (const key of keys) {
      const related = relationships.get(key);
      if (related) related.push(requirement);
      else relationships.set(key, [requirement]);
    }
  }

  const expiring = selectDashboardApprovalExpirations(
    approvals,
    evaluationTime,
    days
  ).map((approval) => ({
    ...approval,
    relatedRequirements:
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
  return { expiringRequirements, expiredRequirements, expiring, expired };
}
