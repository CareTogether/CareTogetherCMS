import { AccountInfo } from "@azure/msal-browser";
import { atom, selector, useRecoilValue } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { Permission, UserLocationAccess, UsersClient } from "../GeneratedClient";

export const activeAccountState = atom<AccountInfo | null>({
  key: 'activeAccountState',
  default: null
});

export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const activeAccount = get(activeAccountState);
    if (activeAccount) {
      const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const userResponse = await usersClient.getUserOrganizationAccess();
      return userResponse;
    } else {
      return null;
    }
  }
});

export const currentOrganizationState = atom({
  key: 'currentOrganizationState',
  default: ''
});

export const availableLocationsState = atom({
  key: 'availableLocationsState',
  default: [] as UserLocationAccess[]
});

export const currentLocationState = atom({
  key: 'currentLocationState',
  default: ''
});

export const currentPermissionsState = atom({
  key: 'currentPermissionsState',
  default: [] as Permission[]
});

export function usePermissions() {
  const currentPermissions = useRecoilValue(currentPermissionsState);
  return (permission: Permission) => currentPermissions.includes(permission);
}
