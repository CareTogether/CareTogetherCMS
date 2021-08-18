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
        private readonly AuthorizationProvider authorizationProvider;
        private readonly IApprovalManager approvalManager;

        public VolunteerFamiliesController(AuthorizationProvider authorizationProvider, IApprovalManager approvalManager)
        {
            this.authorizationProvider = authorizationProvider;
            this.approvalManager = approvalManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<VolunteerFamily>>> ListAllVolunteerFamiliesAsync(Guid organizationId, Guid locationId)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var referrals = await approvalManager.ListVolunteerFamiliesAsync(authorizedUser, organizationId, locationId);

            return Ok(referrals);
        }

        [HttpPost("volunteerFamilyCommand")]
        public async Task<ActionResult<VolunteerFamily>> SubmitVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerFamilyCommand command)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await approvalManager.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, authorizedUser, command);

            return result.Match<ActionResult<VolunteerFamily>>(
                volunteerFamily => volunteerFamily,
                notAllowed => BadRequest(),
                notFound => NotFound());
        }

        [HttpPost("volunteerCommand")]
        public async Task<ActionResult<VolunteerFamily>> SubmitVolunteerCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] VolunteerCommand command)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await approvalManager.ExecuteVolunteerCommandAsync(organizationId, locationId, authorizedUser, command);

            return result.Match<ActionResult<VolunteerFamily>>(
                volunteerFamily => volunteerFamily,
                notAllowed => BadRequest(),
                notFound => NotFound());
        }

        [HttpPost("addAdult")]
        public async Task<ActionResult<VolunteerFamily>> SubmitApprovalCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ApprovalCommand command)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await approvalManager.ExecuteApprovalCommandAsync(organizationId, locationId, authorizedUser, command);

            return result.Match<ActionResult<VolunteerFamily>>(
                volunteerFamily => volunteerFamily,
                notAllowed => BadRequest(),
                notFound => NotFound());
        }
    }
}
