using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CareTogether.Api.Services;
using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class RecentRecordsController(IRecordsManager records, RecentRecordsStore history)
        : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<RecentRecord[]>> ListAsync(
            Guid organizationId,
            Guid locationId,
            CancellationToken cancellationToken
        )
        {
            if (!TryGetUser(organizationId, locationId, out var userId))
                return Forbid();

            var entries = await history.ListAsync(
                userId,
                organizationId,
                locationId,
                cancellationToken
            );
            var visible = await records.FilterVisibleRecentRecordsAsync(
                User,
                organizationId,
                locationId,
                entries.Select(entry => entry.Record).ToImmutableHashSet()
            );
            return Ok(entries.Where(entry => visible.Contains(entry.Record)).ToArray());
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> RecordAsync(
            Guid organizationId,
            Guid locationId,
            [FromBody] RecentRecordKey record,
            CancellationToken cancellationToken
        )
        {
            if (!TryGetUser(organizationId, locationId, out var userId))
                return Forbid();

            if (record.Id == Guid.Empty || !Enum.IsDefined(record.Type))
                return BadRequest();

            var visit = new RecentRecord(record, TimeProvider.System.GetUtcNow());
            var visible = await records.FilterVisibleRecentRecordsAsync(
                User,
                organizationId,
                locationId,
                [record]
            );
            if (!visible.Contains(record))
                return NotFound();

            await history.RecordAsync(userId, organizationId, locationId, visit, cancellationToken);
            return NoContent();
        }

        private bool TryGetUser(Guid organizationId, Guid locationId, out Guid userId)
        {
            return Guid.TryParse(User.FindFirst(Claims.UserId)?.Value, out userId)
                && userId != Guid.Empty
                && User.HasClaim(Claims.OrganizationId, organizationId.ToString("D"))
                && User.LocationIdentity(organizationId, locationId)
                    ?.HasClaim(Claims.LocationId, locationId.ToString("D")) == true;
        }
    }
}
