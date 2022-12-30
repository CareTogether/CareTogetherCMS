using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Approvals;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class VolunteersController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;

        public VolunteersController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }


        [HttpPost("volunteerFamilyCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerFamilyCommand command)
        {
            var result = await recordsManager.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("volunteerCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitVolunteerCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerCommand command)
        {
            var result = await recordsManager.ExecuteVolunteerCommandAsync(organizationId, locationId, User, command);
            return result;
        }
    }
}
