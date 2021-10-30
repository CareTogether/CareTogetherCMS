using CareTogether.Managers;
using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
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


        [HttpPost("directoryCommand")]
        public async Task<ActionResult<Family>> SubmitDirectoryCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] DirectoryCommand command)
        {
            var result = await directoryManager.ExecuteDirectoryCommandAsync(organizationId, locationId, User, command);
            return result;
        }

        [HttpPost("personCommand")]
        public async Task<ActionResult<Family>> SubmitPersonCommandAsync(Guid organizationId, Guid locationId,
            Guid familyId, [FromBody] PersonCommand command)
        {
            var result = await directoryManager.ExecutePersonCommandAsync(organizationId, locationId, User, familyId, command);
            return result;
        }
    }
}
