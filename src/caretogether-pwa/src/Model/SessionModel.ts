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

export function usePermissions() {
  const currentPermissions = useRecoilValue(currentPermissionsState);
  return (permission: Permission) => currentPermissions.includes(permission);
}
