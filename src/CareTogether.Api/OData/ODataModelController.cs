using CareTogether.Managers;
using CareTogether.Managers.Directory;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using NSwag.Annotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.OData
{
    public sealed record Organization(Guid Id, string Name,
        IEnumerable<Location> Locations)
    {
        [Key]
        public Guid ODataId => Id;
    }

    public sealed record Location(Guid Id, string Name,
        IEnumerable<Family> Families);

    public sealed record Family(Guid Id, string Name);


    [Route("api/odata")]
    [OpenApiIgnore]
    public class ODataModelController : ODataController
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryManager directoryManager;

        public ODataModelController(IPoliciesResource policiesResource,
            IDirectoryManager directoryManager)
        {
            this.policiesResource = policiesResource;
            this.directoryManager = directoryManager;
        }


        [HttpGet("Organizations")]
        public async Task<Organization[]> GetOrganizations()
        {
            var userOrganizationIds = GetUserOrganizationIds();
            var organizations = await Task.WhenAll(userOrganizationIds.Select(async organizationId =>
            {
                var organizationConfiguration = await policiesResource.GetConfigurationAsync(organizationId);
                var userAvailableLocations = organizationConfiguration.Users[User.UserId()].LocationRoles
                    .Select(locationRole => locationRole.LocationId)
                    .ToArray();

                var locations = await Task.WhenAll(organizationConfiguration.Locations
                    .Where(location => userAvailableLocations.Contains(location.Id))
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
