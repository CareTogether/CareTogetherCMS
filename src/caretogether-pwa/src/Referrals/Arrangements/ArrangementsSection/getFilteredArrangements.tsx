import { Referral } from '../../../GeneratedClient';

export const getFilteredArrangements = (
  referral: Referral,
  selectedOptions: string[]
) => {
  return (referral?.arrangements || [])
    .filter((arrangement) => {
      if (selectedOptions.length === 0) return true;

      return selectedOptions.some((status) => {
        if (
          status === 'Active' &&
          !arrangement.cancelledAtUtc &&
          !arrangement.endedAtUtc
        )
          return true;
        if (status === 'Cancelled' && arrangement.cancelledAtUtc) return true;
        if (status === 'Ended' && arrangement.endedAtUtc) return true;
        return false;
      });
    })
    .sort((a, b) => {
      const aDate = a.requestedAtUtc ?? a.startedAtUtc ?? new Date(0);
      const bDate = b.requestedAtUtc ?? b.startedAtUtc ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
};
