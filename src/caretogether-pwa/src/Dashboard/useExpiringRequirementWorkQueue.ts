import { atom, useAtomValue } from 'jotai';
import { Permission } from '../GeneratedClient';
import { buildOrganizationApprovalLedgerRows } from '../Communities/useOrganizationApprovalViewModel';
import {
  mapLoadedValue,
  selectedLocationContextState,
  visibleCommunitiesAtom,
  visibleFamiliesAtom,
} from '../Model/Data';
import {
  buildExpiringRequirementWorkQueue,
  type ExpiringRequirementWorkItem,
} from './expiringRequirementWorkQueue';

const emptyQueue: readonly ExpiringRequirementWorkItem[] = [];

const expiringRequirementWorkQueueAtom = atom((get) => {
  const scope = get(selectedLocationContextState);
  if (!scope) return emptyQueue;

  const families = get(visibleFamiliesAtom);
  const communities = get(visibleCommunitiesAtom);
  return mapLoadedValue(families, (visibleFamilies) =>
    mapLoadedValue(communities, (visibleCommunities) =>
      buildExpiringRequirementWorkQueue(
        scope,
        visibleFamilies,
        visibleCommunities.flatMap((community) =>
          community.community?.id &&
          community.approvalInfo &&
          community.userPermissions?.includes(Permission.ViewApprovalStatus) &&
          community.userPermissions.includes(Permission.ViewApprovalProgress)
            ? [
                {
                  communityId: community.community.id,
                  rows: buildOrganizationApprovalLedgerRows(community),
                },
              ]
            : []
        ),
        new Date()
      )
    )
  );
});

export function useExpiringRequirementWorkQueue() {
  return useAtomValue(expiringRequirementWorkQueueAtom);
}
