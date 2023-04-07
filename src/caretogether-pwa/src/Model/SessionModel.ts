import { atom, selector } from "recoil";
import { CombinedFamilyInfo, CommunityInfo, Permission, UserLocationAccess } from "../GeneratedClient";
import { useLoadable } from "../Hooks/useLoadable";
import { localStorageEffect } from "../Utilities/localStorageEffect";
import { useFamilyLookup } from "./DirectoryModel";
import { api } from "../Api/Api";


export const selectedLocationIdState = atom<string | null>({
  key: 'selectedLocationIdState',
  effects: [
    localStorageEffect('locationId'),
    // ({onSet}) => {
    //   onSet(newId => console.log("SEL_LOC_ID: " + newId))
    // }
  ]
})

export const currentLocationState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentLocationState',
  get: ({get}) => {
    const value = get(currentLocationQuery);
    return value.locationId!;
  }
});

export const redemptionSessionIdState = atom<string | null>({
  key: 'redemptionSessionIdState',
  default: null
});

export const inviteReviewInfoQuery = selector({
  key: 'inviteReviewInfoQuery',
  get: async ({get}) => {
    const redemptionSessionId = get(redemptionSessionIdState);
    
    if (redemptionSessionId) {
      const inviteReviewInfo = await api.users.examinePersonInviteRedemptionSession(redemptionSessionId);
      return inviteReviewInfo;
    } else {
      return null;
    }
}});

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
