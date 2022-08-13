import { AccountInfo } from "@azure/msal-browser";
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

export const currentOrganizationState = selector({//TODO: rename to 'query'
  key: 'currentOrganizationState',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    return userOrganizationAccess?.organizationId ?? null;
  }
});

export const availableLocationsState = selector({//TODO: rename to 'query'
  key: 'availableLocationsState',
  get: ({get}) => {
    const userOrganizationAccess = get(userOrganizationAccessQuery);
    return userOrganizationAccess?.locationIds ?? null;
  }
});

export const currentLocationState = atom({//TODO: Make this 'selectedLocationState'
  key: 'currentLocationState',
  default: ''
});

export const currentPermissionsState = atom({//TODO: Make this a query off userOrganizationAccessQuery and selectedLocationState
  key: 'currentPermissionsState',
  default: [] as Permission[]
});

export function usePermissions() {
  const currentPermissions = useRecoilValue(currentPermissionsState);
  return (permission: Permission) => currentPermissions.includes(permission);
}
