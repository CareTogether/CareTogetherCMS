using CareTogether.Resources;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        private readonly IAccountsResource accountsResource;
        private readonly IPoliciesResource policiesResource;

        public TenantUserClaimsTransformation(IAccountsResource accountsResource, IPoliciesResource policiesResource)
        {
            this.accountsResource = accountsResource;
            this.policiesResource = policiesResource;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var claimsIdentity = new ClaimsIdentity();
            var userId = principal.UserId();

            // Look up the tenant access for the user.
            var userTenantAccess = await accountsResource.GetTenantAccessSummaryAsync(principal);
            
            var organizationId = userTenantAccess.OrganizationId;
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.OrganizationId, organizationId.ToString());

            //// Look up the person info corresponding to the user.
            //var locationId = userTenantAccess.LocationIds.First(); //NOTE: Currently only one location per user is supported.
            //var person = await communitiesResource.FindUserAsync(organizationId, locationId, principal.UserId());
            //principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, person!.Id.ToString());

            // Then look up the organization-managed role access and person ID for that user.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            
            var userAccessConfiguration = configuration.Users[userId];
            foreach (var locationRole in userAccessConfiguration.LocationRoles)
            {
                //TODO: We should either define a more complex claims structure or scope authentication to a user-specified location.
                principal.AddClaimOnlyOnce(claimsIdentity, Claims.LocationId, locationRole.LocationId.ToString());
                principal.AddClaimOnlyOnce(claimsIdentity, claimsIdentity.RoleClaimType, locationRole.RoleName);
                principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, userAccessConfiguration.PersonId.ToString());
            }

            //TODO: Store the individual permissions (set union of role grants minus set union of role denies),
            //      rather than the coarse-grained roles?

            claimsIdentity.Label = "Tenant User";
            principal.AddIdentity(claimsIdentity);
            return principal;
        }
    }
}
