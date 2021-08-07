using CareTogether.Resources.Storage;
using System;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        private readonly IObjectStore<EffectiveLocationPolicy> locationPoliciesStore;


        public PoliciesResource(IObjectStore<EffectiveLocationPolicy> locationPoliciesStore)
        {
            this.locationPoliciesStore = locationPoliciesStore;
        }


        public async Task<ResourceResult<ReferralPolicy>> GetEffectiveReferralPolicy(Guid organizationId, Guid locationId,
            int? version = null)
        {
            if (version == null)
                version = 1;
            else if (version != 1)
                return ResourceResult.NotFound;

            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, version.ToString());
            return result.TryPickT0(out var success, out var _)
                ? success.Value.ReferralPolicy
                : ResourceResult.NotFound;
        }

        public async Task<ResourceResult<VolunteerPolicy>> GetEffectiveVolunteerPolicy(Guid organizationId, Guid locationId,
            int? version = null)
        {
            if (version == null)
                version = 1;
            else if (version != 1)
                return ResourceResult.NotFound;

            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, version.ToString());
            return result.TryPickT0(out var success, out var _)
                ? success.Value.VolunteerPolicy
                : ResourceResult.NotFound;
        }
    }
}
