using CareTogether.Resources;
using Microsoft.AspNetCore.Authentication;
using System.Linq;
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
            //TODO: This is currently a not-quite-circular reference as AccountsResource looks up roles from the ClaimsPrincipal.
            //      It works, the way this code is written, but it's messy and should be fixed when implementing org switching.
            var userTenantAccess = await accountsResource.GetUserOrganizationAccessAsync(principal);
            
            var organizationId = userTenantAccess.OrganizationId;
            principal.AddClaimOnlyOnce(claimsIdentity, Claims.OrganizationId, organizationId.ToString());

            //// Look up the person info corresponding to the user.
            //var locationId = userTenantAccess.LocationIds.First(); //NOTE: Currently only one location per user is supported.
            //var person = await directoryResource.FindUserAsync(organizationId, locationId, principal.UserId());
            //principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, person!.Id.ToString());

            // Then look up the organization-managed role access and person ID for that user.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            
            var userAccessConfiguration = configuration.Users[userId];
            foreach (var locationRole in userAccessConfiguration.LocationRoles)
            {
                //TODO: We should either define a more complex claims structure, or scope authentication to a user-specified location.
                //      One possible structure would be a ClaimsIdentity per location, requiring the current location to be
                //      factored in when evaluating claims on the principal.
                principal.AddClaimOnlyOnce(claimsIdentity, Claims.LocationId, locationRole.LocationId.ToString());
                principal.AddClaimOnlyOnce(claimsIdentity, claimsIdentity.RoleClaimType, locationRole.RoleName);
                principal.AddClaimOnlyOnce(claimsIdentity, Claims.PersonId, userAccessConfiguration.PersonId.ToString());

                var rolePermissions = configuration.Roles
                    .Single(role => role.RoleName == locationRole.RoleName)
                    .Permissions;
                foreach (var rolePermission in rolePermissions)
                    claimsIdentity.AddClaim(new Claim(Claims.Permission, rolePermission.ToString()));
            }

            claimsIdentity.Label = "Tenant User";
            principal.AddIdentity(claimsIdentity);
            return principal;
        }
    }
}
