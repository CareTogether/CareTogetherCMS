using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.V1Referrals;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    [ApiController]
[Route("/api/{organizationId:guid}/{locationId:guid}/referrals")]
[Authorize(
    Policies.ForbidAnonymous,
    AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
)]
public sealed class V1ReferralsController : ControllerBase
{
    private readonly IV1ReferralsResource referralsResource;
    private readonly IAuthorizationEngine authorizationEngine;

    public V1ReferralsController(
        IV1ReferralsResource referralsResource,
        IAuthorizationEngine authorizationEngine
    )
    {
        this.referralsResource = referralsResource;
        this.authorizationEngine = authorizationEngine;
    }

[HttpGet]
public async Task<ActionResult<ImmutableList<V1Referral>>> ListReferralsAsync(
    Guid organizationId,
    Guid locationId
)
{
    var userContext = new SessionUserContext(User, null);

    var isAuthorized = await authorizationEngine.AuthorizeV1ReferralReadAsync(
        organizationId,
        locationId,
        userContext
    );

    if (!isAuthorized)
        return Forbid();

    var referrals = await referralsResource.ListReferralsAsync(
        organizationId,
        locationId
    );

    return Ok(referrals);
}

  }
}
