using CareTogether.Resources.Storage;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources
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


        public async Task<ResourceResult<OrganizationConfiguration>> GetConfigurationAsync(Guid organizationId)
        {
            var result = await configurationStore.GetAsync(organizationId, Guid.Empty, "config");
            return result.TryPickT0(out var success, out var _)
                ? success.Value
                : ResourceResult.NotFound;
        }

        public async Task<ResourceResult<EffectiveLocationPolicy>> GetCurrentPolicy(Guid organizationId, Guid locationId)
        {
            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, "policy");
            return result.TryPickT0(out var success, out var _)
                ? success.Value
                : ResourceResult.NotFound;
        }
    }
}
