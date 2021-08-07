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
    public class ReferralsController : ControllerBase
    {
        private readonly AuthorizationProvider authorizationProvider;
        private readonly IReferralManager referralManager;

        public ReferralsController(AuthorizationProvider authorizationProvider, IReferralManager referralManager)
        {
            this.authorizationProvider = authorizationProvider;
            this.referralManager = referralManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Referral>>> ListAllReferralsAsync(Guid organizationId, Guid locationId)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var referrals = await referralManager.ListReferralsAsync(organizationId, locationId);

            return Ok(referrals);
        }

        [HttpPost("referralCommand")]
        public async Task<ActionResult<Referral>> SubmitReferralCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ReferralCommand command)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await referralManager.ExecuteReferralCommandAsync(organizationId, locationId, authorizedUser, command);
            return result.Match<ActionResult<Referral>>(
                referral => referral,
                notAllowed => BadRequest(),
                notFound => NotFound());
        }

        [HttpPost("arrangementCommand")]
        public async Task<ActionResult<Referral>> SubmitArrangementCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ArrangementCommand command)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var result = await referralManager.ExecuteArrangementCommandAsync(organizationId, locationId, authorizedUser, command);

            return result.Match<ActionResult<Referral>>(
                referral => referral,
                notAllowed => BadRequest(),
                notFound => NotFound());
        }
    }
}
