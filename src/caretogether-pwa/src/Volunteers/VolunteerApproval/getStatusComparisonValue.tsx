import { RoleApprovalStatus } from '../../GeneratedClient';

//#endregion
export function getStatusComparisonValue(
  s?: string | number | RoleApprovalStatus | null | undefined
): number {
  if (!s) return 0;
  switch (s) {
    case RoleApprovalStatus.Prospective:
    case 'Prospective':
    case 'prospective':
    case '1':
    case 1:
      return 1;
    case RoleApprovalStatus.Approved:
    case 'Approved':
    case 'approved':
    case '3':
    case 3:
      return 3;
    case RoleApprovalStatus.Onboarded:
    case 'Onboarded':
    case 'onboarded':
    case '4':
    case 4:
      return 4;
    case RoleApprovalStatus.Expired:
    case 'Expired':
    case 'expired':
    case '2':
    case 2:
      return 2;
    case RoleApprovalStatus.Inactive:
    case 'Inactive':
    case 'inactive':
    case '5':
    case 5:
      return 5;
    case RoleApprovalStatus.Denied:
    case 'Denied':
    case 'denied':
    case '6':
    case 6:
      return 6;
    default:
      return 0;
  }
}
