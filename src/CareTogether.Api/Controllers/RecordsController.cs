using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class RecordsController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;

        public RecordsController(IRecordsManager recordsManager)
        {
            this.recordsManager = recordsManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecordsAggregate>>> ListVisibleAggregatesAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            var results = await recordsManager.ListVisibleAggregatesAsync(User, organizationId, locationId);
            return Ok(results);
        }

        [HttpPost("atomicRecordsCommand")]
        public async Task<ActionResult<RecordsAggregate?>> SubmitAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            [FromBody] AtomicRecordsCommand command
        )
        {
            var result = await recordsManager.ExecuteAtomicRecordsCommandAsync(
                organizationId,
                locationId,
                User,
                command
            );
            return Ok(result);
        }

        [HttpPost("compositeRecordsCommand")]
        public async Task<ActionResult<RecordsAggregate?>> SubmitCompositeRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            [FromBody] CompositeRecordsCommand command
        )
        {
            var result = await recordsManager.ExecuteCompositeRecordsCommand(organizationId, locationId, User, command);
            return Ok(result);
        }
    }
}
