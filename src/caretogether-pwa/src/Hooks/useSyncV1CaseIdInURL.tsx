import { useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useSyncV1CaseIdInURL = ({
  familyId,
  v1CaseIdFromQuery,
  selectedV1CaseId,
}: {
  familyId: string;
  v1CaseIdFromQuery?: string;
  selectedV1CaseId?: string;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedNavigate = useMemo(() => navigate, []);

  useEffect(() => {
    if (v1CaseIdFromQuery !== selectedV1CaseId) {
      const searchParams = new URLSearchParams(location.search);

      if (selectedV1CaseId) {
        searchParams.set('v1CaseId', selectedV1CaseId);
      } else {
        searchParams.delete('v1CaseId');
      }

      const searchParamsString = searchParams.size
        ? `?${searchParams.toString()}`
        : '';

      memoizedNavigate(`${location.pathname}${searchParamsString}`, {
        replace: true,
      });
    }
  }, [
    familyId,
    location.pathname,
    location.search,
    v1CaseIdFromQuery,
    selectedV1CaseId,
    memoizedNavigate,
  ]);
};
