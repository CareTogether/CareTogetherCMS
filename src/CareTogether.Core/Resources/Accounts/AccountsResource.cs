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

        public async Task<UserOrganizationAccess> GetUserOrganizationAccessAsync(ClaimsPrincipal user)
        {
            var summary = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, user.UserId().ToString());

            //TODO: Properly handle multiple organizations and locations.
            //TODO: Also, this should not happen here. This should perhaps be an AuthorizationEngine method,
            //      and derive only from the underlying data sources instead of the values on the ClaimsPrincipal.
            var roles = user.FindAll(ClaimsIdentity.DefaultRoleClaimType)
                .Select(c => c.Value).ToImmutableList();
            var permissions = user.FindAll(Claims.Permission)
                .Select(c => Enum.Parse<Permission>(c.Value)).ToImmutableList();

            return new UserOrganizationAccess(summary.OrganizationId, summary.LocationIds
                .Select(locationId => new UserLocationAccess(locationId, roles, permissions))
                .ToImmutableList());
        }
    }
}
