using CareTogether.Managers;
using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    [FeatureGate(FeatureFlags.ViewReferrals)]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    public class ReferralsController : ControllerBase
    {
        private readonly IReferralManager referralManager;

        public ReferralsController(IReferralManager referralManager)
        {
            this.referralManager = referralManager;
        }


        [HttpPost("referralCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitReferralCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ReferralCommand command)
        {
            var result = await referralManager.ExecuteReferralCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("arrangementCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitArrangementCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ArrangementCommand command)
        {
            var result = await referralManager.ExecuteArrangementCommandAsync(organizationId, locationId, User, command);
            return result;
        }
    }
}
