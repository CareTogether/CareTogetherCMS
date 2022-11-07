using CareTogether.Managers;
using CareTogether.Managers.Referrals;
using CareTogether.Resources.Referrals;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [FeatureGate(FeatureFlags.ViewReferrals)]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ReferralsController : ControllerBase
    {
        private readonly IReferralsManager referralsManager;

        public ReferralsController(IReferralsManager referralsManager)
        {
            this.referralsManager = referralsManager;
        }


        [HttpPost("referralCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitReferralCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ReferralCommand command)
        {
            var result = await referralsManager.ExecuteReferralCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("arrangementCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitArrangementsCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] ArrangementsCommand command)
        {
            var result = await referralsManager.ExecuteArrangementsCommandAsync(organizationId, locationId, User, command);
            return result;
        }
    }
}
