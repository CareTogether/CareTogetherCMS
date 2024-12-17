using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;
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
        readonly IRecordsManager _RecordsManager;

        public RecordsController(IRecordsManager recordsManager)
        {
            _RecordsManager = recordsManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecordsAggregate>>> ListVisibleAggregatesAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            ImmutableList<RecordsAggregate>? results = await _RecordsManager.ListVisibleAggregatesAsync(
                User,
                organizationId,
                locationId
            );
            return Ok(results);
        }

        [HttpPost("atomicRecordsCommand")]
        public async Task<ActionResult<RecordsAggregate?>> SubmitAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            [FromBody] AtomicRecordsCommand command
        )
        {
            RecordsAggregate? result = await _RecordsManager.ExecuteAtomicRecordsCommandAsync(
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
            RecordsAggregate? result = await _RecordsManager.ExecuteCompositeRecordsCommand(
                organizationId,
                locationId,
                User,
                command
            );
            return Ok(result);
        }
    }
}
