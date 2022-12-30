using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Utilities.Telephony;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    public sealed record SendSmsToFamilyPrimaryContactsRequest(
        ImmutableList<Guid> FamilyIds, string SourceNumber, string Message);

    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DirectoryController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;

        public DirectoryController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<CombinedFamilyInfo>>> ListVisibleFamiliesAsync(Guid organizationId, Guid locationId)
        {
            var referrals = await recordsManager.ListVisibleFamiliesAsync(User, organizationId, locationId);

            return Ok(referrals);
        }

        [HttpPost("directoryCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitDirectoryCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] DirectoryCommand command)
        {
            var result = await recordsManager.ExecuteDirectoryCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("familyCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitFamilyCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] FamilyCommand command)
        {
            var result = await recordsManager.ExecuteRecordsCommandAsync(organizationId, locationId, User,
                new FamilyRecordsCommand(command));
            return result;
        }

        [HttpPost("personCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitPersonCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] PersonCommand command)
        {
            var result = await recordsManager.ExecuteRecordsCommandAsync(organizationId, locationId, User,
                new PersonRecordsCommand(familyId, command));
            return result;
        }

        [HttpPost("noteCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitNoteCommandAsync(
            Guid organizationId, Guid locationId, [FromBody] NoteCommand command)
        {
            var result = await recordsManager.ExecuteRecordsCommandAsync(organizationId, locationId, User,
                new NoteRecordsCommand(command));
            return result;
        }

        [HttpPost("sendSmsToFamilyPrimaryContacts")]
        public async Task<ActionResult<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>>>
            SendSmsToFamilyPrimaryContactsAsync(Guid organizationId, Guid locationId,
            [FromBody] SendSmsToFamilyPrimaryContactsRequest request)
        {
            var result = await recordsManager.SendSmsToFamilyPrimaryContactsAsync(organizationId, locationId,
                User, request.FamilyIds, request.SourceNumber, request.Message);
            return result;
        }
    }
}
