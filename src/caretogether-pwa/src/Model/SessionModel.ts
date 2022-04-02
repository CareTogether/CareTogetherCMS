import { atom, useRecoilValue } from "recoil";
import { Permission, UserLocationAccess } from "../GeneratedClient";

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
