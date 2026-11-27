import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import {
  selectedLocationContextState,
  visibleCommunitiesAtom,
  visibleFamiliesAtom,
} from '../Model/Data';
import {
  buildApprovalExpirationWorkQueue,
  type ApprovalExpirationWorkItem,
} from './approvalExpirationWorkQueue';

const emptyQueue: readonly ApprovalExpirationWorkItem[] = [];

export function useApprovalExpirationWorkQueue(utcDay: string) {
  const scope = useAtomValue(selectedLocationContextState);
  const families = useAtomValue(visibleFamiliesAtom);
  const communities = useAtomValue(visibleCommunitiesAtom);
  return useMemo(
    () =>
      scope
        ? buildApprovalExpirationWorkQueue(
            scope,
            families,
            communities,
            new Date(utcDay)
          )
        : emptyQueue,
    [scope, families, communities, utcDay]
  );
}
