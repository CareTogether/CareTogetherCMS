using CareTogether.Resources.Storage;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class AccountsResource : IAccountsResource
    {
        private readonly IObjectStore<UserTenantAccessSummary> configurationStore;


        public AccountsResource(IObjectStore<UserTenantAccessSummary> configurationStore)
        {
            this.configurationStore = configurationStore;
        }


        public async Task<UserTenantAccessSummary> GetTenantAccessSummaryAsync(ClaimsPrincipal user)
        {
            var result = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, user.UserId().ToString());
            return result;
        }
    }
}
