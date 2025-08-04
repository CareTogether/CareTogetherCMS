import { useMemo, useEffect } from 'react';
import { useAppNavigate } from './useAppNavigate';

export const useSyncV1CaseIdInURL = ({
  familyId,
  v1CaseIdFromQuery,
  selectedV1CaseId,
}: {
  familyId: string;
  v1CaseIdFromQuery?: string;
  selectedV1CaseId?: string;
}) => {
  const appNavigate = useAppNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedNavigateFamily = useMemo(() => appNavigate.family, []);

  useEffect(() => {
    if (v1CaseIdFromQuery !== selectedV1CaseId) {
      memoizedNavigateFamily(familyId, selectedV1CaseId, undefined, {
        replace: true,
      });
    }
  }, [familyId, v1CaseIdFromQuery, selectedV1CaseId, memoizedNavigateFamily]);
};
