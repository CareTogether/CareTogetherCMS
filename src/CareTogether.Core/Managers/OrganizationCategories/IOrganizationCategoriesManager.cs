using System;
using System.Threading.Tasks;
using CareTogether.Resources.Policies;

namespace CareTogether.Managers.OrganizationCategories
{
    public interface IOrganizationCategoriesManager
    {
        Task<OrganizationConfiguration> UpsertCategoryAsync(
            Guid organizationId,
            OrganizationCategory category
        );

        Task<OrganizationConfiguration> DeleteCategoryAsync(
            Guid organizationId,
            Guid categoryId
        );
    }
}
