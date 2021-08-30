using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [Authorize]
    [ApiController]
    public class ConfigurationController : ControllerBase
    {
        private readonly AuthorizationProvider authorizationProvider;
        private readonly IPoliciesResource policiesResource;

        public ConfigurationController(AuthorizationProvider authorizationProvider, IPoliciesResource policiesResource)
        {
            this.authorizationProvider = authorizationProvider;
            this.policiesResource = policiesResource;
        }


        [HttpGet("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> GetOrganizationConfiguration(Guid organizationId)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, Guid.Empty, User);

            var configurationResult = await policiesResource.GetConfigurationAsync(organizationId);
            return configurationResult.TryPickT0(out var configuration, out _)
                ? Ok(configuration)
                : NotFound();
        }

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/policy")]
        public async Task<ActionResult<EffectiveLocationPolicy>> GetEffectiveLocationPolicy(Guid organizationId, Guid locationId)
        {
            var authorizedUser = await authorizationProvider.AuthorizeAsync(organizationId, locationId, User);

            var policyResult = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            return policyResult.TryPickT0(out var policy, out _)
                ? Ok(policy)
                : NotFound();
        }
    }
}
