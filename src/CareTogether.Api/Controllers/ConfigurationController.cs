using System;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;

namespace CareTogether.Api.Controllers
{
    public sealed record CurrentFeatureFlags(bool InviteUser, bool FamilyScreenV2, bool FamilyScreenPageVersionSwitch);

    [ApiController]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ConfigurationController : ControllerBase
    {
        readonly IAuthorizationEngine _AuthorizationEngine;
        readonly IFeatureManager _FeatureManager;
        readonly IPoliciesResource _PoliciesResource;

        public ConfigurationController(
            IPoliciesResource policiesResource,
            IFeatureManager featureManager,
            IAuthorizationEngine authorizationEngine
        )
        {
            //TODO: Delegate this controller's methods to a manager service
            _PoliciesResource = policiesResource;
            _FeatureManager = featureManager;
            _AuthorizationEngine = authorizationEngine;
        }

        [HttpGet("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> GetOrganizationConfiguration(Guid organizationId)
        {
            OrganizationConfiguration? result = await _PoliciesResource.GetConfigurationAsync(organizationId);
            return Ok(result);
        }

        [HttpPut("/api/{organizationId:guid}/[controller]/roles/{roleName}")]
        public async Task<ActionResult<OrganizationConfiguration>> PutRoleDefinition(
            Guid organizationId,
            string roleName,
            [FromBody] RoleDefinition role
        )
        {
            if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
            {
                return Forbid();
            }

            OrganizationConfiguration? result = await _PoliciesResource.UpsertRoleDefinitionAsync(
                organizationId,
                roleName,
                role
            );
            return Ok(result);
        }

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/policy")]
        public async Task<ActionResult<EffectiveLocationPolicy>> GetEffectiveLocationPolicy(
            Guid organizationId,
            Guid locationId
        )
        {
            EffectiveLocationPolicy? result = await _PoliciesResource.GetCurrentPolicy(organizationId, locationId);
            return Ok(result);
        }

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/flags")]
        public async Task<ActionResult<CurrentFeatureFlags>> GetLocationFlags()
        {
            CurrentFeatureFlags? result =
                new(
                    await _FeatureManager.IsEnabledAsync(nameof(FeatureFlags.InviteUser)),
                    await _FeatureManager.IsEnabledAsync(nameof(FeatureFlags.FamilyScreenV2)),
                    await _FeatureManager.IsEnabledAsync(nameof(FeatureFlags.FamilyScreenPageVersionSwitch))
                );
            return Ok(result);
        }
    }
}
