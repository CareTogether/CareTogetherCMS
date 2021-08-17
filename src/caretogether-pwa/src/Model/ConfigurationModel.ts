import { selector } from "recoil";
import { ActivityRequirement, ConfigurationClient, FormUploadRequirement, VolunteerFamilyRequirementScope } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentLocationState, currentOrganizationState } from "./SessionModel";

export const organizationConfigurationData = selector({
  key: 'organizationConfigurationData',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getOrganizationConfiguration(organizationId);
    return dataResponse;
  }});

export const organizationNameData = selector({
  key: 'organizationNameData',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationData);
    return organizationConfiguration.organizationName as string;
  }
})

export const locationNameData = selector({
  key: 'locationNameData',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationData);
    const currentLocationId = get(currentLocationState);
    return organizationConfiguration.locations?.find(x => x.id === currentLocationId)?.name as string;
  }
})

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

export const adultDocumentTypesData = selector({
  key: 'adultDocumentTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    const familyAllAdultForms = (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const formUploads = familyRolePolicy.approvalRequirements
            ?.filter(requirement =>
              requirement.actionRequirement instanceof FormUploadRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily)
            ?.map(requirement => requirement.actionRequirement as FormUploadRequirement) || [];
          return previous.concat(formUploads);
        }, [] as FormUploadRequirement[])) || [];
    const individualForms = (policy.volunteerPolicy?.volunteerRoles &&
      Object.entries(policy.volunteerPolicy.volunteerRoles)
        .reduce((previous, [, rolePolicy]) => {
          const formUploads = rolePolicy.approvalRequirements
            ?.filter(requirement =>requirement.actionRequirement instanceof FormUploadRequirement)
            ?.map(requirement => requirement.actionRequirement as FormUploadRequirement) || [];
          return previous.concat(formUploads);
        }, [] as FormUploadRequirement[])) || [];
    return familyAllAdultForms.concat(individualForms)
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.formName === familyFormUploadRequirement.formName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as FormUploadRequirement[]);
  }});

export const adultActivityTypesData = selector({
  key: 'adultActivityTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    const familyAllAdultActivities = (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const activities = familyRolePolicy.approvalRequirements
            ?.filter(requirement =>
              requirement.actionRequirement instanceof ActivityRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily)
            ?.map(requirement => requirement.actionRequirement as ActivityRequirement) || [];
          return previous.concat(activities);
        }, [] as ActivityRequirement[])) || [];
    const individualActivities = (policy.volunteerPolicy?.volunteerRoles &&
      Object.entries(policy.volunteerPolicy.volunteerRoles)
        .reduce((previous, [, rolePolicy]) => {
          const activities = rolePolicy.approvalRequirements
            ?.filter(requirement =>requirement.actionRequirement instanceof ActivityRequirement)
            ?.map(requirement => requirement.actionRequirement as ActivityRequirement) || [];
          return previous.concat(activities);
        }, [] as ActivityRequirement[])) || [];
    return familyAllAdultActivities.concat(individualActivities)
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.activityName === familyFormUploadRequirement.activityName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as ActivityRequirement[]);
  }});
