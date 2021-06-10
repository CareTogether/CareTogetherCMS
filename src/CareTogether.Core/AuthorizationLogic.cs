using CareTogether.Resources;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether
{
    public sealed class AuthorizationLogic
    {
        private readonly ICommunitiesResource communitiesResource;


        public AuthorizationLogic(ICommunitiesResource communitiesResource)
        {
            this.communitiesResource = communitiesResource;
        }


        public async Task<AuthorizedUser> AuthorizeAsync(Guid organizationId, Guid locationId, ClaimsPrincipal principal)
        {
            //TODO: This should be provided before managers are called (by an authorization layer) so the logic can be uniformly extracted.
            var userResult = await communitiesResource.FindUserAsync(organizationId, locationId, principal.UserId());

            return userResult.Match(
                person => new AuthorizedUser(principal, principal.UserId(), person),
                NotFound => throw new InvalidOperationException("No person with the requested user ID was found.")); //TODO: Use a ResourceResult instead?
        }
    }
}
