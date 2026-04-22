import { RoleApprovalStatus } from '../../GeneratedClient';
import { getStatusComparisonValue } from './getStatusComparisonValue';

export function checkStatusEquivalence(
  a?: string | RoleApprovalStatus | null | undefined,
  b?: string | RoleApprovalStatus | null | undefined
): boolean {
  return getStatusComparisonValue(a) == getStatusComparisonValue(b);
}
