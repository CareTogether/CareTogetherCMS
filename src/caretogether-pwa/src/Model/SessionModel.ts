import { atom, selector, useRecoilValue } from "recoil";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { Permission, UserLocationAccess, UsersClient } from "../GeneratedClient";

export const initializeModelRootState = atom<null | true>({
  key: 'initializeModelRootState',
  default: null
});

export const userOrganizationAccessQuery = selector({
  key: 'userOrganizationAccessQuery',
  get: async ({get}) => {
    const initializeUi = get(initializeModelRootState);
    console.log("userOrganizationAccessQuery - initializeUi: " + JSON.stringify(initializeUi));
    if (initializeUi) {
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
