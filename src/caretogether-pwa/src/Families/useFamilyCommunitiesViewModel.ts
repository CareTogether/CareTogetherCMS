import { useMemo } from 'react';
import { CommunityInfo, Permission } from '../GeneratedClient';
import { useCommunityLookup } from '../Model/DirectoryModel';
import { useVisibleCommunitiesLoadable } from '../Model/Data';

export type FamilyCommunitiesViewModel = {
  addCommunityCandidateCommunities: CommunityInfo[];
  canAddCommunity: boolean;
  familyCommunityInfo: CommunityInfo[];
};

export function useFamilyCommunitiesViewModel(
  familyId: string
): FamilyCommunitiesViewModel {
  const communitiesLoadable = useVisibleCommunitiesLoadable();
  const communityLookup = useCommunityLookup();
  const allCommunities = useMemo(
    () =>
      (communitiesLoadable || [])
        .map((communityInfo) => communityInfo.community!)
        .sort((first, second) =>
          first.name! < second.name! ? -1 : first.name! > second.name! ? 1 : 0
        ),
    [communitiesLoadable]
  );
  const allCommunityInfo = useMemo(
    () => allCommunities.map((community) => communityLookup(community.id)!),
    [allCommunities, communityLookup]
  );
  const familyCommunityInfo = useMemo(
    () =>
      allCommunityInfo.filter((communityInfo) =>
        communityInfo.community?.memberFamilies?.includes(familyId)
      ),
    [allCommunityInfo, familyId]
  );
  const addCommunityCandidateCommunities = useMemo(
    () =>
      allCommunityInfo.filter(
        (communityInfo) =>
          communityInfo.community?.id &&
          !(communityInfo.community.memberFamilies ?? []).includes(familyId) &&
          communityInfo.userPermissions?.includes(
            Permission.EditCommunityMemberFamilies
          )
      ),
    [allCommunityInfo, familyId]
  );

  return {
    addCommunityCandidateCommunities,
    canAddCommunity: addCommunityCandidateCommunities.length > 0,
    familyCommunityInfo,
  };
}
