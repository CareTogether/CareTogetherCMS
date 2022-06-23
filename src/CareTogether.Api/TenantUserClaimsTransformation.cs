using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
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
            try
            {
                var tenantUserIdentity = new ClaimsIdentity();
                tenantUserIdentity.Label = "Tenant User";
                var userId = principal.UserId();

                // Look up the tenant access for the user.
                //TODO: This is currently a not-quite-circular reference as AccountsResource looks up roles from the ClaimsPrincipal.
                //      It works, the way this code is written, but it's messy and should be fixed when implementing org switching.
                var userTenantAccess = await accountsResource.GetUserOrganizationAccessAsync(principal);

                var organizationId = userTenantAccess.OrganizationId;
                principal.AddClaimOnlyOnce(tenantUserIdentity, Claims.OrganizationId, organizationId.ToString());
                principal.AddIdentity(tenantUserIdentity);

                // Then look up the organization-managed role access and person ID for that user.
                var configuration = await policiesResource.GetConfigurationAsync(organizationId);

                var userAccessConfiguration = configuration.Users[userId];
                var locationUserIdentities = userAccessConfiguration.LocationRoles
                    .Select(locationRole =>
                    {
                        var locationUserIdentity = new ClaimsIdentity($"{organizationId}:{locationRole.LocationId}");
                        locationUserIdentity.Label = "User Location Access";

                        var locationClaims = new Claim[]
                        {
                            new(Claims.LocationId, locationRole.LocationId.ToString()),
                            new(tenantUserIdentity.RoleClaimType, locationRole.RoleName),
                            new(Claims.PersonId, userAccessConfiguration.PersonId.ToString())
                        };
                        locationUserIdentity.AddClaims(locationClaims);

                        var rolePermissions = configuration.Roles
                            .Single(role => role.RoleName == locationRole.RoleName)
                            .Permissions;
                        var permissionClaims = rolePermissions
                            .Select(rolePermission => new Claim(Claims.Permission, rolePermission.ToString()));
                        locationUserIdentity.AddClaims(permissionClaims);

                        return locationUserIdentity;
                    });
                principal.AddIdentities(locationUserIdentities);

                return principal;
            }
            catch (System.Exception ex)
            {
                throw ex;
            }
        }
    }
}
