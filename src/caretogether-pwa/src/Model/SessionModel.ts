import { atom, selector } from "recoil";
import { CombinedFamilyInfo, CommunityInfo, Permission } from "../GeneratedClient";
import { useLoadable } from "../Hooks/useLoadable";
import { useFamilyLookup } from "./DirectoryModel";
import { api } from "../Api/Api";
import { currentLocationQuery } from "./Data";

export const redemptionSessionIdState = atom<string | null>({
  key: 'redemptionSessionIdState',
  default: null
});

export const inviteReviewInfoQuery = selector({
  key: 'inviteReviewInfoQuery',
  get: async ({ get }) => {
    const redemptionSessionId = get(redemptionSessionIdState);

    if (redemptionSessionId) {
      const inviteReviewInfo = await api.users.examinePersonInviteRedemptionSession(redemptionSessionId);
      return inviteReviewInfo;
    } else {
      return null;
    }
  }
});

function usePermissions(applicablePermissions?: Permission[]) {
  //TODO: If we want to expose a "not-yet-loaded" state, update this to return 'null' from
  //      the callback when 'applicablePermissions' is null (as opposed to undefined).
  return (permission: Permission) => (applicablePermissions || []).includes(permission);
}

export function useGlobalPermissions() {
  const currentLocation = useLoadable(currentLocationQuery);
  return usePermissions(currentLocation?.globalContextPermissions);
}

export function useAllPartneringFamiliesPermissions() {
  const currentLocation = useLoadable(currentLocationQuery);
  return usePermissions(currentLocation?.allPartneringFamiliesContextPermissions);
}

export function useAllVolunteerFamiliesPermissions() {
  const currentLocation = useLoadable(currentLocationQuery);
  return usePermissions(currentLocation?.allVolunteerFamiliesContextPermissions);
}

export function useFamilyIdPermissions(familyId: string) {
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId);
  return usePermissions(family?.userPermissions);
}

export function useFamilyPermissions(family?: CombinedFamilyInfo) {
  return usePermissions(family?.userPermissions);
}

export function useCommunityPermissions(community?: CommunityInfo) {
  return usePermissions(community?.userPermissions);
}
