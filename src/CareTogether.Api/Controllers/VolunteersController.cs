using CareTogether.Managers;
using CareTogether.Managers.Approval;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class VolunteersController : ControllerBase
    {
        private readonly IApprovalManager approvalManager;

        public VolunteersController(IApprovalManager approvalManager)
        {
            this.approvalManager = approvalManager;
        }


        [HttpPost("volunteerFamilyCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerFamilyCommand command)
        {
            var result = await approvalManager.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("volunteerCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitVolunteerCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerCommand command)
        {
            var result = await approvalManager.ExecuteVolunteerCommandAsync(organizationId, locationId, User, command);
            return result;
        }
    }
}
