using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Managers.Communications;
using CareTogether.Utilities.Telephony;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    public sealed record SendSmsToFamilyPrimaryContactsRequest(
        ImmutableList<Guid> FamilyIds,
        string SourceNumber,
        string Message
    );

    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    public class CommunicationsController : ControllerBase
    {
        private readonly ICommunicationsManager communicationsManager;

        public CommunicationsController(ICommunicationsManager communicationsManager)
        {
            this.communicationsManager = communicationsManager;
        }

        [HttpPost("sendSmsToFamilyPrimaryContacts")]
        public async Task<
            ActionResult<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>>
        > SendSmsToFamilyPrimaryContactsAsync(
            Guid organizationId,
            Guid locationId,
            [FromBody] SendSmsToFamilyPrimaryContactsRequest request
        )
        {
            var result = await communicationsManager.SendSmsToFamilyPrimaryContactsAsync(
                organizationId,
                locationId,
                User,
                request.FamilyIds,
                request.SourceNumber,
                request.Message
            );
            return Ok(result);
        }
    }
}
