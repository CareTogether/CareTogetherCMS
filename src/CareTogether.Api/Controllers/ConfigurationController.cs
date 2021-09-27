using CareTogether.Resources;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    [ApiController]
    public class ConfigurationController : ControllerBase
    {
        private readonly IPoliciesResource policiesResource;


        public ConfigurationController(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        [HttpGet("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> GetOrganizationConfiguration(Guid organizationId)
        {
            var result = await policiesResource.GetConfigurationAsync(organizationId);
            return Ok(result);
        }

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/policy")]
        public async Task<ActionResult<EffectiveLocationPolicy>> GetEffectiveLocationPolicy(Guid organizationId, Guid locationId)
        {
            var result = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            return Ok(result);
        }
    }
}
