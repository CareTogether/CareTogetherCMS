using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources.Accounts
{
    public sealed record UserTenantAccessSummary(Guid OrganizationId,
        ImmutableList<Guid> LocationIds);
    public sealed record UserOrganizationAccess(Guid OrganizationId,
        ImmutableList<UserLocationAccess> Locations);
    public sealed record UserLocationAccess(Guid LocationId,
        ImmutableList<string> Roles, ImmutableList<Permission> Permissions);

    /// <summary>
    /// The <see cref="IAccountsResource"/> is responsible for user account management in CareTogether.
    /// </summary>
    public interface IAccountsResource
    {
        Task<UserTenantAccessSummary> GetUserTenantAccessSummaryAsync(Guid userId);

        Task<UserOrganizationAccess> GetUserOrganizationAccessAsync(ClaimsPrincipal user);
    }
}
