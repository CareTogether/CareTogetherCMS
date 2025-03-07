using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Policies
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        private const string CONFIG = "config";
        private const string POLICY = "policy";
        private const string SECRETS = "secrets";


        private readonly IObjectStore<OrganizationConfiguration> configurationStore;
        private readonly IObjectStore<EffectiveLocationPolicy> locationPoliciesStore;
        private readonly IObjectStore<OrganizationSecrets> organizationSecretsStore;


        public PoliciesResource(
            IObjectStore<OrganizationConfiguration> configurationStore,
            IObjectStore<EffectiveLocationPolicy> locationPoliciesStore,
            IObjectStore<OrganizationSecrets> organizationSecretsStore)
        {
            this.configurationStore = configurationStore;
            this.locationPoliciesStore = locationPoliciesStore;
            this.organizationSecretsStore = organizationSecretsStore;
        }


        public async Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId)
        {
            var result = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            return Render(result);
        }

        public async Task<OrganizationConfiguration> UpsertRoleDefinitionAsync(Guid organizationId,
            string roleName, RoleDefinition role)
        {
            if (roleName == SystemConstants.ORGANIZATION_ADMINISTRATOR)
                throw new InvalidOperationException("The organization administrator role cannot be edited.");

            var config = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            var newConfig = config with
            {
                Roles = config.Roles.AddOrReplace(r => r.RoleName == roleName, _ => role)
            };
            await configurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);
            return Render(newConfig);
        }

        public async Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId)
        {
            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, POLICY);

            var effectivePolicy = result with
            {
                ReferralPolicy = result.ReferralPolicy with
                {
                    ArrangementPolicies = result.ReferralPolicy.ArrangementPolicies
                        .Select(ap => ap with
                        {
                            ArrangementFunctions = ap.ArrangementFunctions
                                .Select(af => af with
                                {
                                    EligibleIndividualVolunteerRoles = af.EligibleIndividualVolunteerRoles ??
                                        result.ReferralPolicy.FunctionPolicies
                                            ?.SingleOrDefault(fp => fp.FunctionName == af.FunctionName)
                                            ?.Eligibility.EligibleIndividualVolunteerRoles ?? [],
                                    EligibleVolunteerFamilyRoles = af.EligibleVolunteerFamilyRoles ??
                                        result.ReferralPolicy.FunctionPolicies
                                            ?.SingleOrDefault(fp => fp.FunctionName == af.FunctionName)
                                            ?.Eligibility.EligibleVolunteerFamilyRoles ?? [],
                                    EligiblePeople = af.EligiblePeople ??
                                        result.ReferralPolicy.FunctionPolicies
                                            ?.SingleOrDefault(fp => fp.FunctionName == af.FunctionName)
                                            ?.Eligibility.EligiblePeople ?? []
                                }).ToImmutableList()
                        }).ToImmutableList()
                }
            };

            return effectivePolicy;
        }

        public async Task<OrganizationSecrets> GetOrganizationSecretsAsync(Guid organizationId)
        {
            var result = await organizationSecretsStore.GetAsync(organizationId, Guid.Empty, SECRETS);
            return result;
        }


        private OrganizationConfiguration Render(OrganizationConfiguration config) =>
            config with
            {
                // The 'OrganizationAdministrator' role for each organization is a specially-defined role
                // that always has *all* permissions granted to it. This ensures that administrators never
                // miss out on a newly defined permission that may not have been explicitly granted to
                // them in their organization's role configuration.
                Roles = config.Roles.Insert(0,
                    new RoleDefinition(SystemConstants.ORGANIZATION_ADMINISTRATOR, IsProtected: true, ImmutableList.Create(
                        new ContextualPermissionSet(new GlobalPermissionContext(),
                            Enum.GetValues<Permission>().ToImmutableList()))))
            };
    }
}
