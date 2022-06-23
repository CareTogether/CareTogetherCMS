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
            var tenantUserIdentity = new ClaimsIdentity();
            tenantUserIdentity.Label = "Tenant User";
            var userId = principal.UserId();

            // Look up the tenant access for the user.
            var userTenantAccess = await accountsResource.GetUserTenantAccessSummaryAsync(userId);

            var organizationId = userTenantAccess.OrganizationId;
            principal.AddClaimOnlyOnce(tenantUserIdentity, Claims.OrganizationId, organizationId.ToString());
            principal.AddIdentity(tenantUserIdentity);

            // Then look up the organization-managed role access and person ID for that user.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);

            var userAccessConfiguration = configuration.Users[userId];
            //TODO: There is an inconsistency here -- we are storing/controlling location access both from the
            //      IAccountsResource *and* the IPoliciesResource.
            //      This is a further argument that this method should really just call a method on the
            //      IAuthorizationEngine to obtain the full map of the user's organization/location access,
            //      roles, and permissions, and simply convert that information into ClaimsIdentity form here.
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
    }
}
