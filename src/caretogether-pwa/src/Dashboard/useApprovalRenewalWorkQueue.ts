import { atom, useAtomValue } from 'jotai';
import {
  mapLoadedValue,
  selectedLocationContextState,
  visibleCommunitiesAtom,
  visibleFamiliesAtom,
} from '../Model/Data';
import {
  buildApprovalRenewalWorkQueue,
  type ApprovalRenewalWorkItem,
} from './approvalRenewalWorkQueue';

const emptyQueue: readonly ApprovalRenewalWorkItem[] = [];

const approvalRenewalWorkQueueAtom = atom((get) => {
  const scope = get(selectedLocationContextState);
  if (!scope) return emptyQueue;

  const families = get(visibleFamiliesAtom);
  const communities = get(visibleCommunitiesAtom);
  return mapLoadedValue(families, (visibleFamilies) =>
    mapLoadedValue(communities, (visibleCommunities) =>
      buildApprovalRenewalWorkQueue(scope, visibleFamilies, visibleCommunities)
    )
  );
});

export function useApprovalRenewalWorkQueue() {
  return useAtomValue(approvalRenewalWorkQueueAtom);
}
