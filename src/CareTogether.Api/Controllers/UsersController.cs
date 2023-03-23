using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nito.AsyncEx;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

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
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
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
            var account = await accountsResource.GetUserAccountAsync(User.UserId());
            //TODO: Support multiple organizations per user
            var organizationId = account.Organizations.First().OrganizationId;
            var locations = account.Organizations.First().Locations;

            var userLocationsAccess = (await locations
                .Select(async location =>
                {
                    var locationId = location.LocationId;

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

            var userOrganizationAccess = new UserOrganizationAccess(organizationId, userLocationsAccess);

            return Ok(userOrganizationAccess);
        }
    }
}
