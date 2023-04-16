import { atom, selector } from "recoil";
import { OrganizationConfiguration, RequirementStage, VolunteerFamilyRequirementScope } from "../GeneratedClient";
import { useLoadable } from "../Hooks/useLoadable";
import { api } from "../Api/Api";
import { selectedLocationContextState } from "./Data";

//TODO: Distinguish by organization ID
export const organizationConfigurationEdited = atom<OrganizationConfiguration | null>({
  key: 'organizationConfigurationEdited',
  default: null
});

export const organizationConfigurationQuery = selector({
  key: 'organizationConfigurationQuery',
  get: async ({get}) => {
    const { organizationId } = get(selectedLocationContextState);
    if (organizationId == null)
      return null;
    const edited = get(organizationConfigurationEdited);
    if (edited) {
      return edited;
    } else {
      const dataResponse = await api.configuration.getOrganizationConfiguration(organizationId);
      return dataResponse;
    }
  }});

export const organizationNameQuery = selector({
  key: 'organizationNameQuery',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationQuery);
    return organizationConfiguration?.organizationName!;
  }
})

export const locationConfigurationQuery = selector({
  key: 'locationConfigurationQuery',
  get: ({get}) => {
    const organizationConfiguration = get(organizationConfigurationQuery);
    const { locationId } = get(selectedLocationContextState);
    return organizationConfiguration?.locations!.find(x => x.id === locationId);
  }
});

export const locationNameQuery = selector({
  key: 'locationNameQuery',
  get: ({get}) => {
    const locationConfiguration = get(locationConfigurationQuery);
    return locationConfiguration?.name;
  }
})

export const ethnicitiesData = selector({//TODO: Rename to 'query'
  key: 'COMPATIBILITY__ethnicitiesData',
  get: ({get}) => {
    const locationConfiguration = get(locationConfigurationQuery);
    return locationConfiguration!.ethnicities!;
  }
})

export const adultFamilyRelationshipsData = selector({//TODO: Rename to 'query'
  key: 'COMPATIBILITY__adultFamilyRelationshipsData',
  get: ({get}) => {
    const locationConfiguration = get(locationConfigurationQuery);
    return locationConfiguration!.adultFamilyRelationships!;
  }
})

export const policyData = selector({
  key: 'policyData',
  get: async ({get}) => {
    const { organizationId, locationId } = get(selectedLocationContextState);
    const dataResponse = await api.configuration.getEffectiveLocationPolicy(organizationId, locationId);
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

export const allFunctionsInPolicyQuery = selector({
  key: 'allFunctionsInPolicyQuery',
  get: ({get}) => {
    const policy = get(policyData);
    const allFunctions = policy.referralPolicy?.arrangementPolicies?.flatMap(arrangement =>
      arrangement.arrangementFunctions?.map(arrangementFunction => arrangementFunction.functionName!) || []) || [];
    const uniqueFunctions = Array.from(new Set(allFunctions));
    return uniqueFunctions;
  }});

export interface LocationContext {
  organizationId: string
  locationId: string
}
export const currentOrganizationAndLocationIdsQuery = selector<LocationContext | null>({
  key: 'currentOrganizationAndLocationIdsQuery',
  get: ({get}) => {
    get(organizationConfigurationQuery); //TODO: Figure out why Recoil needs this.
    const { organizationId, locationId } = get(selectedLocationContextState);
    if (!organizationId) //TODO: Remove unreachable case
      return null;
    if (locationId == null) //TODO: Remove unreachable case
      return null;
    return { organizationId, locationId };
  }
})

export const featureFlagQuery = selector({
  key: 'featureFlagQuery',
  get: async ({get}) => {
    const currentOrgAndLoc = get(currentOrganizationAndLocationIdsQuery);;
    if (currentOrgAndLoc == null)
      return null;
    const {organizationId, locationId} = currentOrgAndLoc;
    const dataResponse = await api.configuration.getLocationFlags(organizationId, locationId);
    return dataResponse;
  }});

export function useFeatureFlags() {
  return useLoadable(featureFlagQuery);
}
