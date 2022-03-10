using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed record UserTenantAccessSummary(Guid OrganizationId,
        ImmutableList<Guid> LocationIds);

    public sealed class AccountsResource : IAccountsResource
    {
        private readonly IObjectStore<UserTenantAccessSummary> configurationStore;


        public AccountsResource(IObjectStore<UserTenantAccessSummary> configurationStore)
        {
            this.configurationStore = configurationStore;
        }


        public async Task<UserOrganizationAccess> GetUserOrganizationAccessAsync(ClaimsPrincipal user)
        {
            //TODO: Properly handle multiple organizations and locations.
            var summary = await configurationStore.GetAsync(Guid.Empty, Guid.Empty, user.UserId().ToString());
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
