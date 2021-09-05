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

            //TODO: Look up the user's person ID, organization ID, and roles/permissions per location
            var organizationId = "11111111-1111-1111-1111-111111111111";
            var locationId = "22222222-2222-2222-2222-222222222222";
            var personId = "2b87864a-63e3-4406-bcbc-c0068a13ac05";
            //var userResult = await communitiesResource.FindUserAsync(organizationId, locationId, principal.UserId());
            //return userResult.Match(
            //    person =>
            //    {
            //    },
            //    NotFound => throw new InvalidOperationException("No person with the requested user ID was found.")); //TODO: Use a ResourceResult instead?
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.OrganizationId, organizationId);
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.LocationId, locationId);
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, personId);

            //TODO: Pull role information from the communitiesResource!
            var roles = new List<string>
            {
                Roles.OrganizationAdministrator
            };

            foreach (var role in roles)
                claimsIdentity.AddClaim(new Claim(claimsIdentity.RoleClaimType, role));

            //TODO: Store the individual permissions (set union of role grants minus set union of role denies),
            //      rather than the coarse-grained roles?

            claimsIdentity.Label = "Tenant User";
            principal.AddIdentity(claimsIdentity);
            return Task.FromResult(principal);
        }
    }
}
