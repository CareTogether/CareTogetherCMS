using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using Microsoft.AspNetCore.Authentication;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        private readonly IAccountsResource accountsResource;

        public TenantUserClaimsTransformation(IAccountsResource accountsResource)
        {
            this.accountsResource = accountsResource;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // Skip claims transformations if the principal is not a tenant user (e.g., if it is an API key client).
            var userId = principal.UserIdOrDefault();
            if (userId == null)
                return principal;

            var tenantUserIdentity = new ClaimsIdentity();
            tenantUserIdentity.Label = "Tenant User";

            // Look up the tenant access for the user. Skip claims transformations if the principal does not have
            // an account yet (i.e., hasn't activated any user-to-person links).
            var account = await accountsResource.TryGetUserAccountAsync(userId.Value);
            if (account == null)
                return principal;

            //TODO: Support multiple organizations per user
            var organizationId = account.Organizations.First().OrganizationId;
            principal.AddClaimOnlyOnce(
                tenantUserIdentity,
                Claims.OrganizationId,
                organizationId.ToString()
            );
            principal.AddIdentity(tenantUserIdentity);

            // To represent the ability for users to have different sets of roles by location,
            // each location gets its own claims identity, named using a fixed convention for
            // easy lookup later.
            var locationUserIdentities = account
                .Organizations.First()
                .Locations.Select(location =>
                {
                    var locationUserIdentity = new ClaimsIdentity(
                        $"{organizationId}:{location.LocationId}"
                    );
                    locationUserIdentity.Label = "User Location Access";

                    var locationClaims = new Claim[]
                    {
                        new(Claims.LocationId, location.LocationId.ToString()),
                        new(Claims.PersonId, location.PersonId.ToString()),
                    };
                    locationUserIdentity.AddClaims(locationClaims);

                    //Note: We can't map the complicated role definitions into simple string-based permission claims,
                    //      so instead just map the role names to the location user identity.
                    //      The role definitions are known to the AuthorizationEngine service.
                    var locationRoleClaims = location
                        .Roles.Select(roleName => new Claim(
                            tenantUserIdentity.RoleClaimType,
                            roleName
                        ))
                        .ToArray();
                    locationUserIdentity.AddClaims(locationRoleClaims);

                    return locationUserIdentity;
                });
            principal.AddIdentities(locationUserIdentities);

            return principal;
        }
    }
}
