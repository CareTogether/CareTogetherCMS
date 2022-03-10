using CareTogether.Managers;
using CareTogether.Managers.Directory;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
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
    public class DirectoryController : ControllerBase
    {
        private readonly IDirectoryManager directoryManager;

        public DirectoryController(IDirectoryManager directoryManager)
        {
            this.directoryManager = directoryManager;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<CombinedFamilyInfo>>> ListVisibleFamiliesAsync(Guid organizationId, Guid locationId)
        {
            var referrals = await directoryManager.ListVisibleFamiliesAsync(User, organizationId, locationId);

            return Ok(referrals);
        }

        [HttpPost("directoryCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitDirectoryCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] DirectoryCommand command)
        {
            var result = await directoryManager.ExecuteDirectoryCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("familyCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitFamilyCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] FamilyCommand command)
        {
            var result = await directoryManager.ExecuteFamilyCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("personCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitPersonCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] PersonCommand command)
        {
            var result = await directoryManager.ExecutePersonCommandAsync(organizationId, locationId, User, familyId, command);
            return result;
        }

        [HttpPost("noteCommand")]
        public async Task<ActionResult<CombinedFamilyInfo>> SubmitNoteCommandAsync(Guid organizationId, Guid locationId,
            [FromBody] NoteCommand command)
        {
            var result = await directoryManager.ExecuteNoteCommandAsync(organizationId, locationId, User, command);
            return result;
        }
    }
}
