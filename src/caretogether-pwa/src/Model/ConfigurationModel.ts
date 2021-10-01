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

export const ethnicitiesData = selector({
  key: 'ethnicitiesData',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationData);
    const currentLocationId = get(currentLocationState);
    return organizationConfiguration.locations?.find(x => x.id === currentLocationId)?.ethnicities as string[];
  }
})

export const adultFamilyRelationshipsData = selector({
  key: 'adultFamilyRelationshipsData',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationData);
    const currentLocationId = get(currentLocationState);
    return organizationConfiguration.locations?.find(x => x.id === currentLocationId)?.adultFamilyRelationships as string[];
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
          const formUploads = (familyRolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(familyRolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as FormUploadRequirement))) || [];
          return previous.concat(formUploads.flat());
        }, [] as FormUploadRequirement[])
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.formName === familyFormUploadRequirement.formName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as FormUploadRequirement[])
        .sort((a, b) => a.formName! < b.formName! ? -1 : a.formName! > b.formName! ? 1 : 0)) || [];
  }});

export const familyActivityTypesData = selector({
  key: 'familyActivityTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    return (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const activities = (familyRolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(familyRolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as ActivityRequirement))) || [];
          return previous.concat(activities.flat());
        }, [] as ActivityRequirement[])
        .reduce((previous, familyActivityRequirement) => {
          return previous.filter(x => x.activityName === familyActivityRequirement.activityName).length > 0
            ? previous
            : previous.concat(familyActivityRequirement);
        }, [] as ActivityRequirement[])
        .sort((a, b) => a.activityName! < b.activityName! ? -1 : a.activityName! > b.activityName! ? 1 : 0)) || [];
  }});

export const adultDocumentTypesData = selector({
  key: 'adultDocumentTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    const familyAllAdultForms = (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const formUploads = (familyRolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(familyRolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as FormUploadRequirement))) || [];
          return previous.concat(formUploads.flat());
        }, [] as FormUploadRequirement[])) || [];
    const individualForms = (policy.volunteerPolicy?.volunteerRoles &&
      Object.entries(policy.volunteerPolicy.volunteerRoles)
        .reduce((previous, [, rolePolicy]) => {
          const formUploads = (rolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(rolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as FormUploadRequirement))) || [];
          return previous.concat(formUploads.flat());
        }, [] as FormUploadRequirement[])) || [];
    return familyAllAdultForms.concat(individualForms)
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.formName === familyFormUploadRequirement.formName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as FormUploadRequirement[])
        .sort((a, b) => a.formName! < b.formName! ? -1 : a.formName! > b.formName! ? 1 : 0);
  }});

export const adultActivityTypesData = selector({
  key: 'adultActivityTypesData',
  get: ({get}) => {
    const policy = get(policyData);
    const familyAllAdultActivities = (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const activities = (familyRolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(familyRolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement &&
              requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as ActivityRequirement))) || [];
          return previous.concat(activities.flat());
        }, [] as ActivityRequirement[])) || [];
    const individualActivities = (policy.volunteerPolicy?.volunteerRoles &&
      Object.entries(policy.volunteerPolicy.volunteerRoles)
        .reduce((previous, [, rolePolicy]) => {
          const activities = (rolePolicy.approvalRequirementsByPolicyVersion &&
            Object.entries(rolePolicy.approvalRequirementsByPolicyVersion).map(([version, requirements]) => requirements.filter(requirement =>
              policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement)
            ?.map(requirement => policy.actionDefinitions![requirement.actionName!] as ActivityRequirement))) || [];
          return previous.concat(activities.flat());
        }, [] as ActivityRequirement[])) || [];
    return familyAllAdultActivities.concat(individualActivities)
        .reduce((previous, familyFormUploadRequirement) => {
          return previous.filter(x => x.activityName === familyFormUploadRequirement.activityName).length > 0
            ? previous
            : previous.concat(familyFormUploadRequirement);
        }, [] as ActivityRequirement[])
        .sort((a, b) => a.activityName! < b.activityName! ? -1 : a.activityName! > b.activityName! ? 1 : 0);
  }});
