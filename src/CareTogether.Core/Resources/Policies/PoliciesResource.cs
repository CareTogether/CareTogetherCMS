using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Policies
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        private const string CONFIG = "config";
        private const string POLICY = "policy";
        private const string SECRETS = "secrets";
        private const string ORGANIZATION_ADMINISTRATOR = "OrganizationAdministrator";


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
            if (roleName == ORGANIZATION_ADMINISTRATOR)
                throw new InvalidOperationException("The organization administrator role cannot be edited.");

            var config = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            var newConfig = config with
            {
                Roles = config.Roles.UpdateSingle(r => r.RoleName == roleName, _ => role)
            };
            await configurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);
            return Render(newConfig);
        }

        public async Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId)
        {
            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, POLICY);
            return result;
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
                    new RoleDefinition(ORGANIZATION_ADMINISTRATOR, IsProtected: true, ImmutableList.Create(
                        new ContextualPermissionSet(new GlobalPermissionContext(),
                            Enum.GetValues<Permission>().ToImmutableList()))))
            };
    }
}
