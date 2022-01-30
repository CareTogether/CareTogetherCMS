import { atom, useRecoilValue } from "recoil";
import { Permission } from "../GeneratedClient";

export const currentOrganizationState = atom({
  key: 'currentOrganizationState',
  default: ''
});

export const currentLocationState = atom({
  key: 'currentLocationState',
  default: ''
});

export const currentPermissionsState = atom({
  key: 'currentPermissionsState',
  default: [] as Permission[]
});

export function usePermission(permission: Permission) {
  const currentPermissions = useRecoilValue(currentPermissionsState);
  return currentPermissions.includes(permission);
}
