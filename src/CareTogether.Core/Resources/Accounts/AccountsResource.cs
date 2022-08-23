using CareTogether.Utilities.ObjectStore;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed class AccountsResource : IAccountsResource
    {
        private readonly IObjectStore<UserTenantAccessSummary> configurationStore;


        public AccountsResource(IObjectStore<UserTenantAccessSummary> configurationStore)
        {
            this.configurationStore = configurationStore;
        }


        public async Task<UserTenantAccessSummary> GetUserTenantAccessSummaryAsync(Guid userId)
        {
            var summary = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, userId.ToString());
            return summary;
        }
    }
}
