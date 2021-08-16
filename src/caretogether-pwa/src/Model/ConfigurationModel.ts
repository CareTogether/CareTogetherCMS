import { atom, selector } from "recoil";
import { ActivityRequirement, ConfigurationClient, FormUploadRequirement, VolunteerFamilyRequirementScope } from "../GeneratedClient";
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
  key: 'organizationConfigurationData',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getOrganizationConfiguration(organizationId);
    return dataResponse;
  }});

export const policyData = selector({
  key: 'policyData',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getEffectiveLocationPolicy(organizationId, locationId);
    return dataResponse;
  }});

export const familyDocumentTypesData = selector({
  key: 'familyDocumentTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    return (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const formUploads = familyRolePolicy.approvalRequirements
            ?.filter(requirement =>
              requirement.actionRequirement instanceof FormUploadRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
            ?.map(requirement => requirement.actionRequirement as FormUploadRequirement) || [];
          return previous.concat(formUploads);
        }, [] as FormUploadRequirement[])
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.formName === familyFormUploadRequirement.formName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as FormUploadRequirement[])) || [];
  }});

export const familyActivityTypesData = selector({
  key: 'familyActivityTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    return (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const activities = familyRolePolicy.approvalRequirements
            ?.filter(requirement =>
              requirement.actionRequirement instanceof ActivityRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
            ?.map(requirement => requirement.actionRequirement as ActivityRequirement) || [];
          return previous.concat(activities);
        }, [] as ActivityRequirement[])
        .reduce((previous, familyActivityRequirement) => {
          return previous.filter(x => x.activityName === familyActivityRequirement.activityName).length > 0
            ? previous
            : previous.concat(familyActivityRequirement);
        }, [] as ActivityRequirement[])) || [];
  }});
