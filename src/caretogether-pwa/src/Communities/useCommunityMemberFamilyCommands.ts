import { RemoveCommunityMemberFamily } from '../GeneratedClient';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useCommunityCommand } from '../Model/DirectoryModel';

export function useCommunityMemberFamilyCommands() {
  const removeMemberFamily = useCommunityCommand(
    (communityId, familyId: string) => {
      const command = new RemoveCommunityMemberFamily();
      command.communityId = communityId;
      command.familyId = familyId;
      return command;
    }
  );
  const withBackdrop = useBackdrop();

  async function removeMemberFamilyFromCommunity(
    communityId: string,
    familyId: string
  ) {
    await withBackdrop(async () => {
      await removeMemberFamily(communityId, familyId);
    });
  }

  return {
    removeMemberFamilyFromCommunity,
  };
}
