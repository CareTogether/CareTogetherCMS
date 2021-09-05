using Microsoft.AspNetCore.Authentication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var claimsIdentity = new ClaimsIdentity();
            var userId = principal.UserId();

            //TODO: Look up the user's organization ID and roles/permissions per location
            var organizationId = "11111111-1111-1111-1111-111111111111";
            var locationId = "22222222-2222-2222-2222-222222222222";
            //var userResult = await communitiesResource.FindUserAsync(organizationId, locationId, principal.UserId());
            //return userResult.Match(
            //    person =>
            //    {
            //        var augmentedPrincipal = principal.Identities.First();
            //        augmentedPrincipal.AddClaim(new Claim(Claims.OrganizationId, organizationId.ToString()));
            //        augmentedPrincipal.AddClaim(new Claim(Claims.LocationId, locationId.ToString()));
            //        //TODO: Pull role information from the communitiesResource!
            //        augmentedPrincipal.AddClaim(new Claim(augmentedPrincipal.RoleClaimType, Roles.OrganizationAdministrator));
            //        return new AuthorizedUser(principal, principal.UserId(), person);
            //    },
            //    NotFound => throw new InvalidOperationException("No person with the requested user ID was found.")); //TODO: Use a ResourceResult instead?

            if (!principal.HasClaim(x => x.Type == "organizationId"))
                claimsIdentity.AddClaim(new Claim("organizationId", organizationId));
            if (!principal.HasClaim(x => x.Type == "locationId"))
                claimsIdentity.AddClaim(new Claim("locationId", locationId));

            claimsIdentity.Label = "Tenant User";
            principal.AddIdentity(claimsIdentity);
            return Task.FromResult(principal);
        }
    }
}
