using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record UserTenantAccessSummary(Guid OrganizationId,
        ImmutableList<Guid> LocationIds);

    /// <summary>
    /// The <see cref="IAccountsResource"/> is responsible for user account management in CareTogether.
    /// </summary>
    public interface IAccountsResource
    {
        Task<UserTenantAccessSummary> GetTenantAccessSummaryAsync(ClaimsPrincipal user);
    }
}
