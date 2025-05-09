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
      const aStart = a.startedAtUtc?.getTime() || 0;
      const bStart = b.startedAtUtc?.getTime() || 0;
      const aRequested = a.requestedAtUtc?.getTime() || 0;
      const bRequested = b.requestedAtUtc?.getTime() || 0;

      return bStart - aStart || bRequested - aRequested;
    });
};
