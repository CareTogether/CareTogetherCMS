using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Policies
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        private readonly IObjectStore<OrganizationConfiguration> configurationStore;
        private readonly IObjectStore<EffectiveLocationPolicy> locationPoliciesStore;


        public PoliciesResource(
            IObjectStore<OrganizationConfiguration> configurationStore,
            IObjectStore<EffectiveLocationPolicy> locationPoliciesStore)
        {
            this.configurationStore = configurationStore;
            this.locationPoliciesStore = locationPoliciesStore;
        }


        public async Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId)
        {
            var result = await configurationStore.GetAsync(organizationId, Guid.Empty, "config");
            return result with
            {
                // The 'OrganizationAdministrator' role for each organization is a specially-defined role
                // that always has *all* permissions granted to it. This ensures that administrators never
                // miss out on a newly defined permission that may not have been explicitly granted to
                // them in their organization's role configuration.
                Roles = result.Roles.Insert(0,
                    new RoleDefinition("OrganizationAdministrator",
                        Enum.GetValues<Permission>().ToImmutableList()))
            };
        }

        public async Task<EffectiveLocationPolicy> GetCurrentPolicy(Guid organizationId, Guid locationId)
        {
            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, "policy");
            return result;
        }
    }
}
