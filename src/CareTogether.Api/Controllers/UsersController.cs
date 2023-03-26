using CareTogether.Managers;
using CareTogether.Managers.Membership;
using CareTogether.Resources.Accounts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    public sealed class MembershipOptions
    {
        public const string Membership = "Membership";

        public string PersonInviteLinkFormat { get; set; } = String.Empty;
    }

    [ApiController]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class UsersController : ControllerBase
    {
        private readonly IMembershipManager membershipManager;
        private readonly IOptions<MembershipOptions> membershipOptions;


        public UsersController(IMembershipManager membershipManager,
            IOptions<MembershipOptions> membershipOptions)
        {
            this.membershipManager = membershipManager;
            this.membershipOptions = membershipOptions;
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

        [HttpPost("/api/[controller]/personInviteLink")]
        public async Task<ActionResult<Uri>> GeneratePersonInviteLink(
            [FromQuery] Guid organizationId, [FromQuery] Guid locationId, [FromQuery] Guid personId)
        {
            var inviteNonce = await membershipManager.GenerateUserInviteNonceAsync(User,
                organizationId, locationId, personId);
            
            var inviteNonceHexString = Convert.ToHexString(inviteNonce);
            
            var inviteLink = new Uri(
                string.Format(membershipOptions.Value.PersonInviteLinkFormat,
                    organizationId, locationId, inviteNonceHexString));

            return Ok(inviteLink);
        }

        [HttpPost("/api/[controller]/redeemPersonInviteLink")]
        public async Task<ActionResult<Account>> RedeemPersonInviteLink(
            [FromQuery] Guid organizationId, [FromQuery] Guid locationId, [FromQuery] string inviteNonce)
        {
            var nonceBytes = Convert.FromHexString(inviteNonce);

            var redemptionResult = await membershipManager.TryRedeemUserInviteNonceAsync(User,
                organizationId, locationId, nonceBytes);

            return Ok(redemptionResult);
        }
    }
}
