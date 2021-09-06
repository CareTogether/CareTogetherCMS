using CareTogether.Resources;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IHttpContextAccessor httpContextAccessor;

        public TenantUserClaimsTransformation(IPoliciesResource policiesResource,
            IHttpContextAccessor httpContextAccessor)
        {
            this.policiesResource = policiesResource;
            this.httpContextAccessor = httpContextAccessor;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var claimsIdentity = new ClaimsIdentity();
            var userId = principal.UserId();

            // Look up the permissions for the organization that the user is trying to access.
            // These permissions will be maintained in the session cookie.
            if (httpContextAccessor.HttpContext == null ||
                !httpContextAccessor.HttpContext.Request.RouteValues.TryGetValue("organizationId", out var orgId))
                return principal;
            var organizationPolicy = await policiesResource.GetConfigurationAsync(Guid.Parse((string)orgId!));

            if (!organizationPolicy.TryPickT0(out var configuration, out var _))
                return principal;

            if (!configuration.Users.ContainsKey(userId))
                return principal;

            //TODO: Look up the user's person ID, organization ID, and roles/permissions per location
            //var organizationId = "11111111-1111-1111-1111-111111111111";
            //var locationId = "22222222-2222-2222-2222-222222222222";
            //var personId = "2b87864a-63e3-4406-bcbc-c0068a13ac05";
            //var userResult = await communitiesResource.FindUserAsync(organizationId, locationId, principal.UserId());
            //return userResult.Match(
            //    person =>
            //    {
            //    },
            //    NotFound => throw new InvalidOperationException("No person with the requested user ID was found.")); //TODO: Use a ResourceResult instead?
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.OrganizationId, (string)orgId!);
            //principal.AddClaimOnlyOnce(claimsIdentity, Claims.LocationId, locationId);
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, configuration.Users[userId].PersonId.ToString());

            foreach (var locationRole in configuration.Users[userId].LocationRoles)
            {
                //TODO: Fix this to properly scope the session to just one location at a time!
                claimsIdentity.AddClaim(new Claim(Claims.LocationId, locationRole.LocationId.ToString()));
                claimsIdentity.AddClaim(new Claim(claimsIdentity.RoleClaimType, locationRole.RoleName));
            }

            //TODO: Store the individual permissions (set union of role grants minus set union of role denies),
            //      rather than the coarse-grained roles?

            claimsIdentity.Label = "Tenant User";
            principal.AddIdentity(claimsIdentity);
            return principal;
        }
    }
}
