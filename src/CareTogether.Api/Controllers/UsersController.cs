using CareTogether.Managers;
using CareTogether.Managers.Membership;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class UsersController : ControllerBase
    {
        private readonly IMembershipManager membershipManager;


        public UsersController(IMembershipManager membershipManager)
        {
            this.membershipManager = membershipManager;
        }


        [HttpGet("/api/[controller]/me/tenantAccess")]
        public async Task<ActionResult<UserOrganizationAccess>> GetUserOrganizationAccess()
        {
            var userAccess = await membershipManager.GetUserAccessAsync(User);

            //TODO: Support multiple organizations per user!
            return Ok(userAccess.Organizations.First());
        }

        [HttpPut("/api/[controller]/personRoles")]
        public async Task<ActionResult<CombinedFamilyInfo>> ChangePersonRolesAsync(
            [FromQuery] Guid organizationId, [FromQuery] Guid locationId, [FromQuery] Guid personId,
            [FromBody] ImmutableList<string> roles)
        {
            var result = await membershipManager.ChangePersonRolesAsync(User,
                organizationId, locationId, personId, roles);
            
            return Ok(result);
        }
    }
}
