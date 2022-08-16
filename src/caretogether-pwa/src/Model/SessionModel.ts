import { atom, selector } from "recoil";
import { accessTokenFetchQuery } from "../Authentication/AuthenticatedHttp";
import { Permission, UserLocationAccess, UsersClient } from "../GeneratedClient";
import { useLoadable } from "../Hooks/useLoadable";

export const userIdState = atom<string | null>({
  key: 'userIdState'
});

export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const accessTokenFetch = get(accessTokenFetchQuery);
    const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, accessTokenFetch);
    const userResponse = await usersClient.getUserOrganizationAccess();
    return userResponse;
  }
});

export const currentOrganizationIdQuery = selector({
  key: 'currentOrganizationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    return userOrganizationAccess.organizationId!;
  }
});

export const currentOrganizationState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentOrganizationState',
  get: ({get}) => {
    const value = get(currentOrganizationIdQuery);
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

export const selectedLocationIdState = atom<string>({
  key: 'selectedLocationIdState'
})

export const currentLocationQuery = selector({
  key: 'currentLocationQuery',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    const selectedLocationId = get(selectedLocationIdState);
    return userOrganizationAccess.locations!.find(location => location.locationId === selectedLocationId)!;
  }
});

export const currentLocationState = selector({//TODO: Deprecated
  key: 'COMPATIBILITY__currentLocationState',
  get: ({get}) => {
    const value = get(currentLocationQuery);
    return value.locationId!;
  }
});

export const currentPermissionsQuery = selector({
  key: 'currentPermissionsQuery',
  get: ({get}) => {
    const currentLocation = get(currentLocationQuery);
    return currentLocation.permissions!;
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
  const currentPermissions = useLoadable(currentPermissionsQuery);
  //TODO: If we want to expose a "not-yet-loaded" state, update this to return 'null' from
  //      the callback when 'currentPermissions' is null.
  return (permission: Permission) => (currentPermissions || []).includes(permission);
}
