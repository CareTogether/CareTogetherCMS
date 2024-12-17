using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using Microsoft.AspNetCore.Authentication;

namespace CareTogether.Api
{
    public class TenantUserClaimsTransformation : IClaimsTransformation
    {
        readonly IAccountsResource _AccountsResource;

        public TenantUserClaimsTransformation(IAccountsResource accountsResource)
        {
            _AccountsResource = accountsResource;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // Skip claims transformations if the principal is not a tenant user (e.g., if it is an API key client).
            Guid? userId = principal.UserIdOrDefault();
            if (userId == null)
            {
                return principal;
            }

            ClaimsIdentity? tenantUserIdentity = new();
            tenantUserIdentity.Label = "Tenant User";

            // Look up the tenant access for the user. Skip claims transformations if the principal does not have
            // an account yet (i.e., hasn't activated any user-to-person links).
            Account? account = await _AccountsResource.TryGetUserAccountAsync(userId.Value);
            if (account == null)
            {
                return principal;
            }

            //TODO: Support multiple organizations per user
            Guid organizationId = account.Organizations.First().OrganizationId;
            principal.AddClaimOnlyOnce(tenantUserIdentity, Claims.OrganizationId, organizationId.ToString());
            principal.AddIdentity(tenantUserIdentity);

            // To represent the ability for users to have different sets of roles by location,
            // each location gets its own claims identity, named using a fixed convention for
            // easy lookup later.
            IEnumerable<ClaimsIdentity>? locationUserIdentities = account
                .Organizations.First()
                .Locations.Select(location =>
                {
                    ClaimsIdentity? locationUserIdentity = new($"{organizationId}:{location.LocationId}");
                    locationUserIdentity.Label = "User Location Access";

                    Claim[]? locationClaims = new Claim[]
                    {
                        new(Claims.LocationId, location.LocationId.ToString()),
                        new(Claims.PersonId, location.PersonId.ToString()),
                    };
                    locationUserIdentity.AddClaims(locationClaims);

                    //Note: We can't map the complicated role definitions into simple string-based permission claims,
                    //      so instead just map the role names to the location user identity.
                    //      The role definitions are known to the AuthorizationEngine service.
                    Claim[]? locationRoleClaims = location
                        .Roles.Select(roleName => new Claim(tenantUserIdentity.RoleClaimType, roleName))
                        .ToArray();
                    locationUserIdentity.AddClaims(locationRoleClaims);

                    return locationUserIdentity;
                });
            principal.AddIdentities(locationUserIdentities);

            return principal;
        }
    }
}
