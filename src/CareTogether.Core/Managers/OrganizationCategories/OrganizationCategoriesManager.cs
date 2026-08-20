using System;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Policies;

namespace CareTogether.Managers.OrganizationCategories
{
    public sealed class OrganizationCategoriesManager : IOrganizationCategoriesManager
    {
        private readonly IPoliciesResource policiesResource;
        private readonly ICommunitiesResource communitiesResource;

        public OrganizationCategoriesManager(
            IPoliciesResource policiesResource,
            ICommunitiesResource communitiesResource
        )
        {
            this.policiesResource = policiesResource;
            this.communitiesResource = communitiesResource;
        }

        public Task<OrganizationConfiguration> UpsertCategoryAsync(
            Guid organizationId,
            OrganizationCategory category
        ) => policiesResource.UpsertOrganizationCategoryAsync(organizationId, category);

        public async Task<OrganizationConfiguration> DeleteCategoryAsync(
            Guid organizationId,
            Guid categoryId
        )
        {
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            var category = configuration.OrganizationCategories.SingleOrDefault(category =>
                category.Id == categoryId
            );
            if (category == null)
                throw new InvalidOperationException(
                    "The specified organization category does not exist."
                );

            var communitiesByLocation = await Task.WhenAll(
                configuration
                    .Locations.Select(location => location.Id)
                    .OfType<Guid>()
                    .Select(locationId =>
                        communitiesResource.ListLocationCommunitiesAsync(
                            organizationId,
                            locationId
                        )
                    )
            );
            if (
                communitiesByLocation.Any(communities =>
                    communities.Any(community => community.CategoryIds.Contains(categoryId))
                )
            )
                throw new InvalidOperationException(
                    $"Cannot delete organization category '{category.Name}' because it is assigned to one or more organizations."
                );

            return await policiesResource.DeleteOrganizationCategoryAsync(
                organizationId,
                categoryId
            );
        }
    }
}
