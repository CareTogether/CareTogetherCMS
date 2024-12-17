using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Resources.Policies
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        const string CONFIG = "config";
        const string POLICY = "policy";
        const string SECRETS = "secrets";

        readonly IObjectStore<OrganizationConfiguration> _ConfigurationStore;
        readonly IObjectStore<EffectiveLocationPolicy> _LocationPoliciesStore;
        readonly IObjectStore<OrganizationSecrets> _OrganizationSecretsStore;

        public PoliciesResource(
            IObjectStore<OrganizationConfiguration> configurationStore,
            IObjectStore<EffectiveLocationPolicy> locationPoliciesStore,
            IObjectStore<OrganizationSecrets> organizationSecretsStore
        )
        {
            _ConfigurationStore = configurationStore;
            _LocationPoliciesStore = locationPoliciesStore;
            _OrganizationSecretsStore = organizationSecretsStore;
        }

        public async Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId)
        {
            OrganizationConfiguration result = await _ConfigurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            return Render(result);
        }

        public async Task<OrganizationConfiguration> UpsertRoleDefinitionAsync(
            Guid organizationId,
            string roleName,
            RoleDefinition role
        )
        {
            if (roleName == SystemConstants.ORGANIZATION_ADMINISTRATOR)
            {
                throw new InvalidOperationException("The organization administrator role cannot be edited.");
            }

            OrganizationConfiguration config = await _ConfigurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            OrganizationConfiguration newConfig = config with
            {
                Roles = config.Roles.UpdateSingle(r => r.RoleName == roleName, _ => role),
            };
            await _ConfigurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);
            return Render(newConfig);
        }

        public async Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId)
        {
            EffectiveLocationPolicy result = await _LocationPoliciesStore.GetAsync(organizationId, locationId, POLICY);

            EffectiveLocationPolicy effectivePolicy = result with
            {
                ReferralPolicy = result.ReferralPolicy with
                {
                    ArrangementPolicies = result
                        .ReferralPolicy.ArrangementPolicies.Select(ap =>
                            ap with
                            {
                                ArrangementFunctions = ap
                                    .ArrangementFunctions.Select(af =>
                                        af with
                                        {
                                            EligibleIndividualVolunteerRoles =
                                                af.EligibleIndividualVolunteerRoles
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(fp =>
                                                        fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligibleIndividualVolunteerRoles
                                                ?? [],
                                            EligibleVolunteerFamilyRoles =
                                                af.EligibleVolunteerFamilyRoles
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(fp =>
                                                        fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligibleVolunteerFamilyRoles
                                                ?? [],
                                            EligiblePeople =
                                                af.EligiblePeople
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(fp =>
                                                        fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligiblePeople
                                                ?? [],
                                        }
                                    )
                                    .ToImmutableList(),
                            }
                        )
                        .ToImmutableList(),
                },
            };

            return effectivePolicy;
        }

        public async Task<OrganizationSecrets> GetOrganizationSecretsAsync(Guid organizationId)
        {
            OrganizationSecrets result = await _OrganizationSecretsStore.GetAsync(organizationId, Guid.Empty, SECRETS);
            return result;
        }

        OrganizationConfiguration Render(OrganizationConfiguration config)
        {
            return config with
            {
                // The 'OrganizationAdministrator' role for each organization is a specially-defined role
                // that always has *all* permissions granted to it. This ensures that administrators never
                // miss out on a newly defined permission that may not have been explicitly granted to
                // them in their organization's role configuration.
                Roles = config.Roles.Insert(
                    0,
                    new RoleDefinition(
                        SystemConstants.ORGANIZATION_ADMINISTRATOR,
                        true,
                        ImmutableList.Create(
                            new ContextualPermissionSet(
                                new GlobalPermissionContext(),
                                Enum.GetValues<Permission>().ToImmutableList()
                            )
                        )
                    )
                ),
            };
        }
    }
}
