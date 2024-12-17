using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Managers.Membership;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Utilities.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class UsersController : ControllerBase
    {
        readonly IMembershipManager _MembershipManager;
        readonly IOptions<MembershipOptions> _MembershipOptions;
        readonly IMemoryCache _RedemptionSessionsCache;

        public UsersController(
            IMembershipManager membershipManager,
            IOptions<MembershipOptions> membershipOptions,
            IMemoryCache redemptionSessionsCache
        )
        {
            _MembershipManager = membershipManager;
            _MembershipOptions = membershipOptions;
            _RedemptionSessionsCache = redemptionSessionsCache;
        }

        [HttpGet("/api/[controller]/me/tenantAccess")]
        public async Task<ActionResult<UserAccess>> GetUserOrganizationAccess()
        {
            UserAccess? userAccess = await _MembershipManager.GetUserAccessAsync(User);

            return Ok(userAccess);
        }

        [HttpGet("/api/[controller]/loginInfo/{organizationId:guid}/{locationId:guid}/{personId:guid}")]
        public async Task<ActionResult<UserLoginInfo>> GetPersonLoginInfoAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        )
        {
            UserLoginInfo? user = await _MembershipManager.GetPersonLoginInfo(
                User,
                organizationId,
                locationId,
                personId
            );

            return Ok(user);
        }

        [HttpPut("/api/[controller]/personRoles")]
        public async Task<ActionResult<FamilyRecordsAggregate>> ChangePersonRolesAsync(
            [FromQuery] Guid organizationId,
            [FromQuery] Guid locationId,
            [FromQuery] Guid personId,
            [FromBody] ImmutableList<string> roles
        )
        {
            FamilyRecordsAggregate? result = await _MembershipManager.ChangePersonRolesAsync(
                User,
                organizationId,
                locationId,
                personId,
                roles
            );

            return Ok(result);
        }

        [HttpPost("/api/[controller]/personInviteLink")]
        public async Task<ActionResult<Uri>> GeneratePersonInviteLink(
            [FromQuery] Guid organizationId,
            [FromQuery] Guid locationId,
            [FromQuery] Guid personId
        )
        {
            byte[]? inviteNonce = await _MembershipManager.GenerateUserInviteNonceAsync(
                User,
                organizationId,
                locationId,
                personId
            );

            string? inviteNonceHexString = Convert.ToHexString(inviteNonce);

            Uri? inviteLink =
                new(
                    string.Format(
                        _MembershipOptions.Value.PersonInviteLinkFormat,
                        organizationId,
                        locationId,
                        inviteNonceHexString
                    )
                );

            return Ok(inviteLink);
        }

        [AllowAnonymous]
        [HttpGet("/api/[controller]/personInvite")]
        public RedirectResult InitiatePersonInviteRedemptionSession(
            [FromQuery] Guid organizationId,
            [FromQuery] Guid locationId,
            [FromQuery] string inviteNonce
        )
        {
            // The client can be assumed to be making this request using page-level navigation, i.e. clicking
            // a link (e.g., in an email or text message) and not having the client UI loaded yet.
            // This method converts the invite link into a redemption session (stored in the server cache with
            // a short expiration) and redirects the client to a UI-based route with a copy of the session ID.
            // The expectation is that the UI will then handle initiating user authentication (if the user is
            // not already authenticated) to ensure the user has a valid user ID, followed by making a request to
            // the CompletePersonInviteRedemptionSession method.
            // Optionally, the UI may first make a request to the ExaminePersonInviteRedemptionSession method to
            // look up the info of the person linked to the invite nonce, giving the client a chance to review
            // the link for correctness before confirming it.

            //NOTE: Considering the maximum lifespan of these redemption sessions, the uniqueness guaranteed by
            //      a GUID should be sufficient protection against an attacker guessing it.
            string? redemptionSessionId = Guid.NewGuid().ToString("N");

            PersonInviteRedemptionSession? redemptionSession =
                new(redemptionSessionId, organizationId, locationId, inviteNonce);

            _RedemptionSessionsCache.Set(redemptionSessionId, redemptionSession, TimeSpan.FromMinutes(20));

            string? redirectUrl = string.Format(
                _MembershipOptions.Value.PersonInviteRedirectFormat,
                redemptionSessionId
            );

            return Redirect(redirectUrl);
        }

        [HttpGet("/api/[controller]/reviewInvite")]
        public async Task<ActionResult<UserInviteReviewInfo?>> ExaminePersonInviteRedemptionSession(
            [FromQuery] string redemptionSessionId
        )
        {
            // The client can be assumed to be making this request from JavaScript, meaning the results can
            // be interpreted by client-side code rather than needing to trigger page-level navigation via redirects.

            PersonInviteRedemptionSession? redemptionSession =
                _RedemptionSessionsCache.Get<PersonInviteRedemptionSession>(redemptionSessionId);
            if (redemptionSession == null)
            {
                return new BadRequestObjectResult("The specified person invite redemption session does not exist.");
            }

            byte[]? nonceBytes = Convert.FromHexString(redemptionSession.InviteNonce);

            UserInviteReviewInfo? inviteInfo = await _MembershipManager.TryReviewUserInviteNonceAsync(
                User,
                redemptionSession.OrganizationId,
                redemptionSession.LocationId,
                nonceBytes
            );

            return Ok(inviteInfo);
        }

        [HttpPost("/api/[controller]/confirmInvite")]
        public async Task<ActionResult<Account>> CompletePersonInviteRedemptionSession(
            [FromQuery] string redemptionSessionId
        )
        {
            // The client can be assumed to be making this request from JavaScript, meaning the results can
            // be interpreted by client-side code rather than needing to trigger page-level navigation via redirects.

            PersonInviteRedemptionSession? redemptionSession =
                _RedemptionSessionsCache.Get<PersonInviteRedemptionSession>(redemptionSessionId);
            if (redemptionSession == null)
            {
                return new BadRequestObjectResult("The specified person invite redemption session does not exist.");
            }

            byte[]? nonceBytes = Convert.FromHexString(redemptionSession.InviteNonce);

            Account? accountAfterInviteRedemption = await _MembershipManager.TryRedeemUserInviteNonceAsync(
                User,
                redemptionSession.OrganizationId,
                redemptionSession.LocationId,
                nonceBytes
            );

            return Ok(accountAfterInviteRedemption);
        }

        sealed record PersonInviteRedemptionSession(
            string RedemptionSessionId,
            Guid OrganizationId,
            Guid LocationId,
            string InviteNonce
        );
    }
}
