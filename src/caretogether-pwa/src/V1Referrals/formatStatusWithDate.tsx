import { V1ReferralStatus } from '../GeneratedClient';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

export function formatStatusWithDate(
  status: V1ReferralStatus,
  openedAt?: Date,
  acceptedAt?: Date,
  closedAt?: Date
) {
  const format = (date?: Date) => (date ? formatUtcDateOnly(date) : '-');

  if (status === V1ReferralStatus.Open) {
    return `Opened ${format(openedAt)}`;
  }

  if (status === V1ReferralStatus.Accepted) {
    return `Accepted ${format(acceptedAt)}`;
  }

  return `Closed ${format(closedAt)}`;
}
