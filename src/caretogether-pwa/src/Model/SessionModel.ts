import { atom } from "recoil";

export const currentOrganizationState = atom({
  key: 'currentOrganizationState',
  default: '11111111-1111-1111-1111-111111111111'
});

export const currentLocationState = atom({
  key: 'currentLocationState',
  default: '22222222-2222-2222-2222-222222222222'
});
