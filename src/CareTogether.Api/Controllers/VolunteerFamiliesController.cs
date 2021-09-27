using CareTogether.Managers;
using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class VolunteerFamiliesController : ControllerBase
    {
        private readonly IApprovalManager approvalManager;

        public VolunteerFamiliesController(IApprovalManager approvalManager)
        {
            this.approvalManager = approvalManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<VolunteerFamily>>> ListAllVolunteerFamiliesAsync(Guid organizationId, Guid locationId)
        {
            var referrals = await approvalManager.ListVolunteerFamiliesAsync(User, organizationId, locationId);

            return Ok(referrals);
        }

        [HttpPost("volunteerFamilyCommand")]
        public async Task<ActionResult<VolunteerFamily>> SubmitVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerFamilyCommand command)
        {
            var result = await approvalManager.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("volunteerCommand")]
        public async Task<ActionResult<VolunteerFamily>> SubmitVolunteerCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerCommand command)
        {
            var result = await approvalManager.ExecuteVolunteerCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("addAdult")]
        public async Task<ActionResult<VolunteerFamily>> SubmitApprovalCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ApprovalCommand command)
        {
            var result = await approvalManager.ExecuteApprovalCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("personCommand")]
        public async Task<ActionResult<VolunteerFamily>> SubmitPersonCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] PersonCommand command)
        {
            var result = await approvalManager.ExecutePersonCommandAsync(organizationId, locationId, User, familyId, command);
            return result;
        }
    }
}
