using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Immutable;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using System.Linq;
using CareTogether.Engines.Authorization;
using Nito.AsyncEx;
using CareTogether.Resources.Directory;

namespace CareTogether.Api.Controllers
{
    public sealed record UserOrganizationAccess(Guid OrganizationId,
        ImmutableList<UserLocationAccess> Locations);
    public sealed record UserLocationAccess(Guid LocationId,
        ImmutableList<string> Roles,
        ImmutableList<Permission> GlobalContextPermissions,
        ImmutableList<Permission> AllVolunteerFamiliesContextPermissions,
        ImmutableList<Permission> AllPartneringFamiliesContextPermissions);

    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IAccountsResource accountsResource;
        private readonly IAuthorizationEngine authorizationEngine;


        public UsersController(IAccountsResource accountsResource,
            IAuthorizationEngine authorizationEngine)
        {
            this.accountsResource = accountsResource;
            this.authorizationEngine = authorizationEngine;
        }


        [HttpGet("/api/[controller]/me/tenantAccess")]
        public async Task<ActionResult<UserOrganizationAccess>> GetUserOrganizationAccess()
        {
            //TODO: This should not happen here. This should perhaps be an AuthorizationEngine method,
            //      and derive only from the underlying data sources instead of the values on the ClaimsPrincipal.
            var tenantAccess = await accountsResource.GetUserTenantAccessSummaryAsync(User.UserId());
            var organizationId = tenantAccess.OrganizationId;
            var locationIds = tenantAccess.LocationIds;

            var userLocationsAccess = (await locationIds
                .Select(async locationId =>
                {
                    var roles = User.LocationIdentity(organizationId, locationId)
                        !.FindAll(ClaimsIdentity.DefaultRoleClaimType)
                        .Select(c => c.Value).ToImmutableList();

                    var globalContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                        organizationId, locationId, User, new GlobalAuthorizationContext());
                    var allVolunteerFamiliesContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                        organizationId, locationId, User, new AllVolunteerFamiliesAuthorizationContext());
                    var allPartneringFamiliesContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                        organizationId, locationId, User, new AllPartneringFamiliesAuthorizationContext());

                    return new UserLocationAccess(locationId, roles,
                        globalContextPermissions,
                        allVolunteerFamiliesContextPermissions,
                        allPartneringFamiliesContextPermissions);
                }).WhenAll()).ToImmutableList();

            var userOrganizationAccess = new UserOrganizationAccess(tenantAccess.OrganizationId, userLocationsAccess);

            return Ok(userOrganizationAccess);
        }
    }
}
