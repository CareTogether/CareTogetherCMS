using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    public sealed record CurrentFeatureFlags(bool ViewReferrals);

    [ApiController]
    public class ConfigurationController : ControllerBase
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IFeatureManager featureManager;


        public ConfigurationController(IPoliciesResource policiesResource, IFeatureManager featureManager)
        {
            this.policiesResource = policiesResource;
            this.featureManager = featureManager;
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

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/flags")]
        public async Task<ActionResult<CurrentFeatureFlags>> GetLocationFlags(Guid organizationId)
        {
            var result = new CurrentFeatureFlags(
                ViewReferrals: await featureManager.IsEnabledAsync(nameof(FeatureFlags.ViewReferrals))
                );
            return Ok(result);
        }
    }
}
