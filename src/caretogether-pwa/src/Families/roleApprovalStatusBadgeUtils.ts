import {
  FamilyRoleApprovalStatus,
  IndividualRoleApprovalStatus,
  RoleRemoval,
} from '../GeneratedClient';
import { isRoleApprovalStatusVisibleInSummary } from '../Volunteers/roleApprovalStatusPresentation';

export type RoleApproval =
  | FamilyRoleApprovalStatus
  | IndividualRoleApprovalStatus
  | undefined;

function isActiveRoleRemoval(roleRemovals: RoleRemoval[] | undefined, role: string) {
  const normalizedRole = normalizeRoleName(role);

  return roleRemovals?.some(
    (removal) =>
      normalizeRoleName(removal.roleName ?? '') === normalizedRole &&
      (!removal.effectiveUntil || removal.effectiveUntil > new Date())
  );
}

function normalizeRoleName(role: string) {
  return role.trim().replace(/\s+/g, ' ');
}

function roleApprovalKey(role: string) {
  return normalizeRoleName(role).toLocaleLowerCase();
}

export function qualifyingRoleApprovals(
  roleApprovals: Record<string, RoleApproval> | undefined,
  roleRemovals: RoleRemoval[] | undefined
) {
  const uniqueApprovals = new Map<string, [string, RoleApproval]>();

  Object.entries(roleApprovals ?? {})
    .filter(
      ([role, approval]) =>
        approval?.currentStatus !== undefined &&
        isRoleApprovalStatusVisibleInSummary(approval.currentStatus) &&
        !isActiveRoleRemoval(roleRemovals, role)
    )
    .sort(([a], [b]) => normalizeRoleName(a).localeCompare(normalizeRoleName(b)))
    .forEach(([role, approval]) => {
      const key = roleApprovalKey(role);

      if (uniqueApprovals.has(key)) {
        return;
      }

      uniqueApprovals.set(key, [normalizeRoleName(role), approval]);
    });

  return [...uniqueApprovals.values()];
}

export function hasQualifyingRoleApprovals(
  roleApprovals: Record<string, RoleApproval> | undefined,
  roleRemovals: RoleRemoval[] | undefined
) {
  return qualifyingRoleApprovals(roleApprovals, roleRemovals).length > 0;
}
