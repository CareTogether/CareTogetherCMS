using CareTogether.Managers.Membership;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
            return Ok(userAccess.Organizations.Single());
        }
    }
}
