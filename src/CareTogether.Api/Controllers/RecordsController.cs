using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CareTogether.Api.Controllers.AppOwnsData.Models;
using CareTogether.Api.Controllers.AppOwnsData.Services;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Rest;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    [Route("/api/{organizationId:guid}/{locationId:guid}/[controller]")]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    public class RecordsController : ControllerBase
    {
        private readonly IRecordsManager recordsManager;
        private readonly PbiEmbedService pbiEmbedService;
        private readonly IOptions<AzureAd> azureAd;
        private readonly IOptions<PowerBI> powerBI;

        public RecordsController(
            IRecordsManager recordsManager,
            PbiEmbedService pbiEmbedService,
            IOptions<AzureAd> azureAd,
            IOptions<PowerBI> powerBI
        )
        {
            this.recordsManager = recordsManager;
            this.pbiEmbedService = pbiEmbedService;
            this.azureAd = azureAd;
            this.powerBI = powerBI;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecordsAggregate>>> ListVisibleAggregatesAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            var results = await recordsManager.ListVisibleAggregatesAsync(
                User,
                organizationId,
                locationId
            );
            return Ok(results);
        }

        [HttpPost("atomicRecordsCommand")]
        public async Task<
            ActionResult<ImmutableList<RecordsAggregate>?>
        > SubmitAtomicRecordsCommandAsync(
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
            var result = await recordsManager.ExecuteCompositeRecordsCommand(
                organizationId,
                locationId,
                User,
                command
            );
            return Ok(result);
        }

        /// <summary>
        /// Returns Embed token, Embed URL, and Embed token expiry to the client
        /// </summary>
        /// <returns>JSON containing parameters for embedding</returns>
        [HttpGet("getEmbedInfo")]
        public async Task<ActionResult<EmbedParams>> GetEmbedInfoAsync()
        {
            try
            {
                // Validate whether all the required configurations are provided in appsettings.json
                string configValidationResult = ConfigValidatorService.ValidateConfig(
                    azureAd,
                    powerBI
                );
                if (configValidationResult != null)
                {
                    HttpContext.Response.StatusCode = 400;
                    return new JsonResult(new { error = configValidationResult });
                }

                var userId = Guid.Parse(User.Claims.First(c => c.Type == Claims.UserId).Value);

                EmbedParams embedParams = await pbiEmbedService.GetEmbedParams(
                    new Guid(powerBI.Value.WorkspaceId),
                    new Guid(powerBI.Value.ReportId),
                    userId
                );
                return Ok(embedParams);
            }
            catch (HttpOperationException exc)
            {
                HttpContext.Response.StatusCode = (int)exc.Response.StatusCode;
                var message = string.Format(
                    "Status: {0} ({1})\r\nResponse: {2}\r\nRequestId: {3}",
                    exc.Response.StatusCode,
                    (int)exc.Response.StatusCode,
                    exc.Response.Content,
                    exc.Response.Headers["RequestId"].FirstOrDefault()
                );
                return new JsonResult(new { error = message });
            }
            catch (Exception ex)
            {
                HttpContext.Response.StatusCode = 500;
                return new JsonResult(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
