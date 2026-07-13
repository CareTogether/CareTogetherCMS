import type { ChipProps } from '@mui/material';
import { RoleApprovalStatus } from '../GeneratedClient';

type RoleApprovalStatusChipColor = NonNullable<ChipProps['color']>;

export function roleApprovalStatusLabel(status: RoleApprovalStatus) {
  return RoleApprovalStatus[status];
}

export function roleApprovalStatusChipColor(
  status: RoleApprovalStatus
): RoleApprovalStatusChipColor {
  switch (status) {
    case RoleApprovalStatus.Prospective:
      return 'secondary';
    case RoleApprovalStatus.Approved:
      return 'success';
    case RoleApprovalStatus.Onboarded:
      return 'primary';
    case RoleApprovalStatus.Expired:
      return 'warning';
    case RoleApprovalStatus.Denied:
      return 'error';
    case RoleApprovalStatus.Inactive:
      return 'default';
    default:
      return 'default';
  }
}

export function isRoleApprovalStatusVisibleInSummary(
  status: RoleApprovalStatus
) {
  return (
    status === RoleApprovalStatus.Prospective ||
    status === RoleApprovalStatus.Expired ||
    status === RoleApprovalStatus.Approved ||
    status === RoleApprovalStatus.Onboarded ||
    status === RoleApprovalStatus.Inactive ||
    status === RoleApprovalStatus.Denied
  );
}
