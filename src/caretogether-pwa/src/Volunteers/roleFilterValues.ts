import type {
  CombinedFamilyInfo,
  RoleApprovalStatus,
} from '../GeneratedClient';
import { isRoleApprovalStatusVisibleInSummary } from './roleApprovalStatusPresentation';

export const notAppliedRoleFilterValue = 'Not Applied';

function roleHasCurrentStatus(
  roleApproval: { currentStatus?: unknown } | null | undefined
) {
  const status = roleApproval?.currentStatus;
  return (
    typeof status === 'number' &&
    isRoleApprovalStatusVisibleInSummary(status as RoleApprovalStatus)
  );
}

export function roleFilterValues(family: CombinedFamilyInfo) {
  const volunteerRoleNames = new Set([
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

  return volunteerRoleNames.size > 0
    ? Array.from(volunteerRoleNames)
    : [notAppliedRoleFilterValue];
}
