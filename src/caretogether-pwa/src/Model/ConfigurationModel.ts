import { atom, selector } from "recoil";
import { ConfigurationClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";

const currentOrganizationState = atom({
  key: 'selectedOrganizationState',
  default: '11111111-1111-1111-1111-111111111111'
});

const currentLocationState = atom({
  key: 'selectedLocationState',
  default: '22222222-2222-2222-2222-222222222222'
});

export const organizationConfigurationData = selector({
  key: 'configuration',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getOrganizationConfiguration(organizationId);
    return dataResponse;
  },
});

export const policyData = selector({
  key: 'configuration',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getEffectiveLocationPolicy(organizationId, locationId);
    return dataResponse;
  },
});
