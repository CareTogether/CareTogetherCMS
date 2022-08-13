import { atom, selector, useRecoilValue } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { Permission, UserLocationAccess, UsersClient } from "../GeneratedClient";

export const userIdState = atom<string | null>({
  key: 'userIdState',
  default: null
});

export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const activeAccount = get(userIdState);
    if (activeAccount) {
      const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const userResponse = await usersClient.getUserOrganizationAccess();
      return userResponse;
    } else {
      return null;
    }
  }
});

export const currentOrganizationQuery = selector({
  key: 'currentOrganizationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    return userOrganizationAccess?.organizationId ?? null;
  }
});

export const currentOrganizationState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentOrganizationState',
  get: ({get}) => {
    const value = get(currentOrganizationQuery);
    return value ?? '';
  }
});

export const availableLocationsQuery = selector({
  key: 'availableLocationsQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    return userOrganizationAccess?.locations ?? null;
  }
});

export const availableLocationsState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__availableLocationsState',
  get: ({get}) => {
    const value = get(availableLocationsQuery);
    return value ?? [] as UserLocationAccess[];
  }
});

export const selectedLocationIdState = atom<string | null>({
  key: 'selectedLocationIdState',
  default: null
})

export const currentLocationQuery = selector({
  key: 'currentLocationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    const selectedLocationId = get(selectedLocationIdState);
    if (userOrganizationAccess == null || userOrganizationAccess.locations == null || selectedLocationId == null) {
      return null;
    } else {
      return userOrganizationAccess.locations.find(location => location.locationId === selectedLocationId) || null;
    }
  }
});

export const currentLocationState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentLocationState',
  get: ({get}) => {
    const value = get(currentLocationQuery);
    return value?.locationId || '';
  }
});

export const currentPermissionsQuery = selector({
  key: 'currentPermissionsQuery',
  get: ({get}) => {
    const currentLocation = get(currentLocationQuery);
    return currentLocation?.permissions || [];
  }
});

export const currentPermissionsState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentPermissionsState',
  get: ({get}) => {
    const value = get(currentPermissionsQuery);
    return value;
  }
});

export function usePermissions() {
  const currentPermissions = useRecoilValue(currentPermissionsQuery);
  return (permission: Permission) => currentPermissions.includes(permission);
}
