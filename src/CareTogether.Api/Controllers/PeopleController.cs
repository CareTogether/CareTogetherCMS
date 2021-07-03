using CareTogether.Managers;
using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class PeopleController : ControllerBase
    {
        private readonly AuthorizationProvider authorizationProvider;
        private readonly IMembershipManager membershipManager;
        private readonly ILogger<ClaimsController> logger;


        public PeopleController(AuthorizationProvider authorizationProvider,
            IMembershipManager membershipManager, ILogger<ClaimsController> logger)
        {
            this.authorizationProvider = authorizationProvider;
            this.membershipManager = membershipManager;
            this.logger = logger;
        }


        [HttpGet]
        public async Task<IActionResult> Get(Guid organizationId, Guid locationId)
        {
            logger.LogInformation("User '{UserName}' was authenticated via '{AuthenticationType}'",
                User.Identity.Name, User.Identity.AuthenticationType);

            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await membershipManager.QueryPeopleAsync(authorizedUser, organizationId, locationId, "");
            if (result.TryPickT0(out var people, out var error))
                return Ok(people);
            else
                return BadRequest(error);
        }
    }
}
