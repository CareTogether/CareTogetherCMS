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
            // Skip claims transformations if the principal is not a tenant user (e.g., if it is an API key client).
            var userId = principal.UserIdOrDefault();
            if (userId == null)
                return principal;

            var tenantUserIdentity = new ClaimsIdentity();
            tenantUserIdentity.Label = "Tenant User";

            // Look up the tenant access for the user.
            var userTenantAccess = await accountsResource.GetUserTenantAccessSummaryAsync(userId.Value);

            var organizationId = userTenantAccess.OrganizationId;
            principal.AddClaimOnlyOnce(tenantUserIdentity, Claims.OrganizationId, organizationId.ToString());
            principal.AddIdentity(tenantUserIdentity);

            // Then look up the organization-managed role access and person ID for that user.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            
            // To represent the ability for users to have different sets of roles by location,
            // each location gets its own claims identity, named using a fixed convention for
            // easy lookup later.
            var userAccessConfiguration = configuration.Users[userId.Value];
            var locationUserIdentities = userAccessConfiguration.LocationRoles
                .Select(locationRoles =>
                {
                    var locationUserIdentity = new ClaimsIdentity($"{organizationId}:{locationRoles.LocationId}");
                    locationUserIdentity.Label = "User Location Access";

                    var locationClaims = new Claim[]
                    {
                        new(Claims.LocationId, locationRoles.LocationId.ToString()),
                        new(Claims.PersonId, userAccessConfiguration.PersonId.ToString())
                    };
                    locationUserIdentity.AddClaims(locationClaims);

                    //Note: We can't map the complicated role definitions into simple string-based permission claims,
                    //      so instead just map the role names to the location user identity.
                    //      The role definitions are known to the AuthorizationEngine service.
                    var locationRoleClaims = locationRoles.RoleNames
                        .Select(roleName => new Claim(tenantUserIdentity.RoleClaimType, roleName))
                        .ToArray();
                    locationUserIdentity.AddClaims(locationRoleClaims);

                    return locationUserIdentity;
                });
            principal.AddIdentities(locationUserIdentities);

            return principal;
        }
    }
}
