import { selector, useRecoilValue } from "recoil";
import { ConfigurationClient, RequirementStage, VolunteerFamilyRequirementScope } from "../GeneratedClient";
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

export const allApprovalAndOnboardingRequirementsData = selector({
  key: 'allApprovalAndOnboardingRequirementsData',
  get: ({get}) => {
    const policy = get(policyData);
    const sortedActionNames = (policy.actionDefinitions && Object.entries(policy.actionDefinitions)
      .map(([actionName,]) => actionName)
      .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) || [];
    return sortedActionNames.filter(actionName =>
      (policy.volunteerPolicy?.volunteerFamilyRoles && Object.entries(policy.volunteerPolicy.volunteerFamilyRoles).some(([role, rolePolicy]) =>
        rolePolicy.policyVersions && Object.entries(rolePolicy.policyVersions).some(([version, rolePolicyVersion]) =>
          rolePolicyVersion.requirements && rolePolicyVersion.requirements.some(requirement =>
            requirement.actionName === actionName && requirement.stage !== RequirementStage.Application)))) ||
      (policy.volunteerPolicy?.volunteerRoles && Object.entries(policy.volunteerPolicy.volunteerRoles).some(([role, rolePolicy]) =>
        rolePolicy.policyVersions && Object.entries(rolePolicy.policyVersions).some(([version, rolePolicyVersion]) =>
          rolePolicyVersion.requirements && rolePolicyVersion.requirements.some(requirement =>
            requirement.actionName === actionName && requirement.stage !== RequirementStage.Application)))));
  }
});

export const familyRequirementsData = selector({
  key: 'familyRequirementsData',
  get: ({get}) => {
    const policy = get(policyData);
    return (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const requirements = (familyRolePolicy.policyVersions?.map(policyVersion => (policyVersion.requirements
            ?.filter(requirement => requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily)
            ?.map(requirement => requirement.actionName!) || []))) || [];
          return previous.concat(requirements.flat());
        }, [] as string[])
        .reduce((previous, familyApprovalRequirement) => {
          return previous.filter(x => x === familyApprovalRequirement).length > 0
            ? previous
            : previous.concat(familyApprovalRequirement);
        }, [] as string[])
        .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) || [];
  }});

export const adultRequirementsData = selector({
  key: 'adultRequirementsData',
  get: ({get}) => {
    const policy = get(policyData);
    const familyAllAdultRequirements = (policy.volunteerPolicy?.volunteerFamilyRoles &&
      Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
        .reduce((previous, [, familyRolePolicy]) => {
          const requirements = (familyRolePolicy.policyVersions?.map(policyVersion => (policyVersion.requirements
            ?.filter(requirement => requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily)
            ?.map(requirement => requirement.actionName!) || []))) || [];
          return previous.concat(requirements.flat());
        }, [] as string[])) || [];
    const individualRequirements = (policy.volunteerPolicy?.volunteerRoles &&
      Object.entries(policy.volunteerPolicy.volunteerRoles)
        .reduce((previous, [, rolePolicy]) => {
          const requirements = (rolePolicy.policyVersions?.map(policyVersion => (policyVersion.requirements
            ?.map(requirement => requirement.actionName!) || []))) || [];
          return previous.concat(requirements.flat());
        }, [] as string[])) || [];
    return familyAllAdultRequirements.concat(individualRequirements)
        .reduce((previous, individualApprovalRequirement) => {
          return previous.filter(x => x === individualApprovalRequirement).length > 0
            ? previous
            : previous.concat(individualApprovalRequirement);
        }, [] as string[])
        .sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  }});

const featureFlagData = selector({
  key: 'featureFlagData',
  get: async ({get}) => {
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await configurationClient.getLocationFlags(organizationId, locationId);
    return dataResponse;
  }});

export function useFeatureFlags() {
  const featureFlags = useRecoilValue(featureFlagData);
  return featureFlags;
}
