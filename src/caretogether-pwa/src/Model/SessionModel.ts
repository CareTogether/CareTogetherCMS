import { atom } from "recoil";

export const currentOrganizationState = atom({
  key: 'currentOrganizationState',
  default: ''
});

export const currentLocationState = atom({
  key: 'currentLocationState',
  default: ''
});
