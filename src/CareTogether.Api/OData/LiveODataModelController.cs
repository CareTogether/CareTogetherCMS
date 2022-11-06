using CareTogether.Managers;
using CareTogether.Managers.Directory;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using NSwag.Annotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.OData
{
    public sealed record Organization([property: Key] Guid Id, string Name,
        IEnumerable<Location> Locations);

    public sealed record Location([property: Key] Guid Id, string Name,
        IEnumerable<Family> Families);

    public sealed record Family([property: Key] Guid Id, string Name);


    [Route("api/odata/live")]
    [OpenApiIgnore]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = "Basic")]
    public class LiveODataModelController : ODataController
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryManager directoryManager;

        public LiveODataModelController(IPoliciesResource policiesResource,
            IDirectoryManager directoryManager)
        {
            this.policiesResource = policiesResource;
            this.directoryManager = directoryManager;
        }


        [HttpGet("Organizations")]
        [EnableQuery(MaxExpansionDepth = int.MaxValue, MaxAnyAllExpressionDepth = int.MaxValue)]
        public async Task<Organization[]> GetOrganizations()
        {
            var userOrganizationIds = GetUserOrganizationIds();
            var organizations = await Task.WhenAll(userOrganizationIds.Select(async organizationId =>
            {
                var organizationConfiguration = await policiesResource.GetConfigurationAsync(organizationId);

                var locations = await Task.WhenAll(organizationConfiguration.Locations
                    .Select(async location =>
                    {
                        var familyRecords = await directoryManager.ListVisibleFamiliesAsync(
                            User, organizationId, location.Id);

                        var families = familyRecords.Select(RenderFamilyInfo).ToList();

                        return new Location(location.Id, location.Name, families);
                    }));

                return new Organization(organizationId,
                    organizationConfiguration.OrganizationName, locations);
            }));

            return organizations;
        }


        private Guid[] GetUserOrganizationIds()
        {
            var singleOrganizationId = User.FindAll(Claims.OrganizationId);
            return singleOrganizationId.Select(claim => Guid.Parse(claim.Value)).ToArray();
        }

        private static Family RenderFamilyInfo(CombinedFamilyInfo family)
        {
            var primaryContactPerson = family.Family.Adults
                .Single(adult => adult.Item1.Id == family.Family.PrimaryFamilyContactPersonId).Item1;
            var familyName = $"{primaryContactPerson.FirstName} {primaryContactPerson.LastName} Family";

            return new Family(family.Family.Id, familyName);
        }
    }
}
