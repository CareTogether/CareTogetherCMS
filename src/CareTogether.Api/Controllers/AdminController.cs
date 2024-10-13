using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NSwag.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [OpenApiIgnore]
    public class AdminController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;

        public AdminController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecordsAggregate>>> ImpersonatedListAllAggregatesAsync(
            Guid organizationId, Guid locationId, [FromQuery] Guid personId, [FromQuery] string role)
        {
            //TODO: Authorization! -- DO NOT MERGE, obviously.
            var impersonationPrincipal = CreateImpersonationPrincipalFor(organizationId, locationId, personId, [role]);
            var results = await recordsManager.ListVisibleAggregatesAsync(impersonationPrincipal, organizationId, locationId);
            return Ok(results);
        }


        private static ClaimsPrincipal CreateImpersonationPrincipalFor(
            Guid organizationId, Guid locationId, Guid personId, string[] roles)
        {
            var impersonationPrincipal = new ClaimsPrincipal();

            var tenantIdentity = new ClaimsIdentity();
            tenantIdentity.Label = "Tenant User";

            impersonationPrincipal.AddClaimOnlyOnce(tenantIdentity, Claims.OrganizationId, organizationId.ToString());
            impersonationPrincipal.AddIdentity(tenantIdentity);

            // To represent the ability for users to have different sets of roles by location,
            // each location gets its own claims identity, named using a fixed convention for
            // easy lookup later.
            var locationUserIdentity = new ClaimsIdentity($"{organizationId}:{locationId}");
            locationUserIdentity.Label = "User Location Access";

            var locationClaims = new Claim[]
            {
                new(Claims.LocationId, locationId.ToString()),
                new(Claims.PersonId, personId.ToString())
            };
            locationUserIdentity.AddClaims(locationClaims);

            //Note: We can't map the complicated role definitions into simple string-based permission claims,
            //      so instead just map the role names to the location user identity.
            //      The role definitions are known to the AuthorizationEngine service.
            var locationRoleClaims = roles
                .Select(roleName => new Claim(tenantIdentity.RoleClaimType, roleName))
                .ToArray();
            locationUserIdentity.AddClaims(locationRoleClaims);

            impersonationPrincipal.AddIdentity(locationUserIdentity);

            return impersonationPrincipal;
        }
    }
}
