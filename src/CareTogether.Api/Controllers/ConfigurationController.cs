using CareTogether.Engines.Authorization;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;
using System;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    public sealed record CurrentFeatureFlags(bool InviteUser);

    [ApiController]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ConfigurationController : ControllerBase
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IFeatureManager featureManager;
        private readonly IAuthorizationEngine authorizationEngine;


        public ConfigurationController(IPoliciesResource policiesResource,
            IFeatureManager featureManager, IAuthorizationEngine authorizationEngine)
        {
            //TODO: Delegate this controller's methods to a manager service
            this.policiesResource = policiesResource;
            this.featureManager = featureManager;
            this.authorizationEngine = authorizationEngine;
        }


        [HttpGet("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> GetOrganizationConfiguration(Guid organizationId)
        {
            var result = await policiesResource.GetConfigurationAsync(organizationId);
            return Ok(result);
        }

        [HttpPut("/api/{organizationId:guid}/[controller]/roles/{roleName}")]
        public async Task<ActionResult<OrganizationConfiguration>> PutRoleDefinition(Guid organizationId,
            string roleName, [FromBody] RoleDefinition role)
        {
            if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
                return Forbid();
            var result = await policiesResource.UpsertRoleDefinitionAsync(organizationId, roleName, role);
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
                InviteUser: await featureManager.IsEnabledAsync(nameof(FeatureFlags.InviteUser))
                );
            return Ok(result);
        }
    }
}
