using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines.Authorization
{
    public interface IUserAccessCalculation
    {
        Task<ImmutableList<Permission>> AuthorizeUserAccessAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AuthorizationContext context
        );
    }
}
