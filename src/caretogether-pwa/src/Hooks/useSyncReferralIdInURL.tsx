import { useMemo, useEffect } from 'react';
import { useAppNavigate } from './useAppNavigate';

export const useSyncReferralIdInURL = ({
  familyId,
  referralIdFromQuery,
  selectedReferralId,
}: {
  familyId: string;
  referralIdFromQuery?: string;
  selectedReferralId?: string;
}) => {
  const appNavigate = useAppNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedNavigateFamily = useMemo(() => appNavigate.family, []);

  useEffect(() => {
    if (referralIdFromQuery !== selectedReferralId) {
      memoizedNavigateFamily(familyId, selectedReferralId, undefined, {
        replace: true,
      });
    }
  }, [
    familyId,
    referralIdFromQuery,
    selectedReferralId,
    memoizedNavigateFamily,
  ]);
};
