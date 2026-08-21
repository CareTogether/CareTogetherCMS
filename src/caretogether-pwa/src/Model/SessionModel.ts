import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  CombinedFamilyInfo,
  CommunityInfo,
  Permission,
} from '../GeneratedClient';
import { useFamilyLookup } from './DirectoryModel';
import { api } from '../Api/Api';
import { useCurrentLocation } from './Data';
import { ORGANIZATION_ADMINISTRATOR } from '../constants';

export const inviteReviewInfoQuery = atomFamily(
  (redemptionSessionId: string | null) =>
    atom(async () => {
      if (redemptionSessionId) {
        const inviteReviewInfo =
          await api.users.examinePersonInviteRedemptionSession(
            redemptionSessionId
          );
        return inviteReviewInfo;
      } else {
        return null;
      }
    })
);

function usePermissions(applicablePermissions?: Permission[]) {
  //TODO: If we want to expose a "not-yet-loaded" state, update this to return 'null' from
  //      the callback when 'applicablePermissions' is null (as opposed to undefined).
  return (permission: Permission) =>
    (applicablePermissions || []).includes(permission);
}

export function useGlobalPermissions() {
  const currentLocation = useCurrentLocation();
  return usePermissions(currentLocation?.globalContextPermissions);
}

export function useAllPartneringFamiliesPermissions() {
  const currentLocation = useCurrentLocation();
  return usePermissions(
    currentLocation?.allPartneringFamiliesContextPermissions
  );
}

export function useAllVolunteerFamiliesPermissions() {
  const currentLocation = useCurrentLocation();
  return usePermissions(
    currentLocation?.allVolunteerFamiliesContextPermissions
  );
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

export function useUserIsOrganizationAdministrator() {
  const currentLocation = useCurrentLocation();
  return currentLocation?.roles?.includes(ORGANIZATION_ADMINISTRATOR);
}
