import type { CombinedFamilyInfo } from '../GeneratedClient';

export const notAppliedRoleFilterValue = 'Not Applied';

function roleHasCurrentStatus(
  roleApproval: { currentStatus?: unknown } | null | undefined
) {
  return (
    roleApproval?.currentStatus !== null &&
    roleApproval?.currentStatus !== undefined
  );
}

export function roleFilterValues(family: CombinedFamilyInfo) {
  const names = new Set([
    ...Object.entries(family.volunteerFamilyInfo?.familyRoleApprovals ?? {})
      .filter(([, roleApproval]) => roleHasCurrentStatus(roleApproval))
      .map(([roleName]) => roleName),
    ...Object.values(
      family.volunteerFamilyInfo?.individualVolunteers ?? {}
    ).flatMap((volunteer) =>
      Object.entries(volunteer.approvalStatusByRole ?? {})
        .filter(([, roleApproval]) => roleHasCurrentStatus(roleApproval))
        .map(([roleName]) => roleName)
    ),
  ]);

  return names.size > 0 ? Array.from(names) : [notAppliedRoleFilterValue];
}
