using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.V1Referrals;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/v1referrals/{referralId:guid}/notes")]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    public sealed class V1ReferralNotesController : ControllerBase
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IV1ReferralNotesResource v1ReferralNotesResource;

        public V1ReferralNotesController(
            IAuthorizationEngine authorizationEngine,
            IV1ReferralNotesResource v1ReferralNotesResource
        )
        {
            this.authorizationEngine = authorizationEngine;
            this.v1ReferralNotesResource = v1ReferralNotesResource;
        }

        [HttpGet]
        public async Task<ActionResult<ImmutableList<V1ReferralNoteEntry>>> ListReferralNotesAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            var userContext = new SessionUserContext(User, null);
            var canRead = await authorizationEngine.AuthorizeV1ReferralReadAsync(
                organizationId,
                locationId,
                userContext
            );

            if (!canRead)
                return Forbid();

            var notes = await v1ReferralNotesResource.ListReferralNotesAsync(
                organizationId,
                locationId,
                referralId
            );

            return Ok(notes);
        }
    }
}
