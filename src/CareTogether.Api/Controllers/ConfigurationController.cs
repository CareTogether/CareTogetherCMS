using CareTogether.Resources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Api.Controllers
{
    public record OrganizationConfiguration(string OrganizationName,
        ImmutableList<LocationConfiguration> Locations);

    public record LocationConfiguration(Guid Id, string Name);

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
            await Task.Yield();

            return Ok(new OrganizationConfiguration("CareTogether",
                ImmutableList<LocationConfiguration>.Empty
                    .Add(new LocationConfiguration(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Atlantis"))
                    .Add(new LocationConfiguration(Guid.Parse("33333333-3333-3333-3333-333333333333"), "El Dorado"))));
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
