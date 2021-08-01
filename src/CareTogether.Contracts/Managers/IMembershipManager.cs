using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    /// <summary>
    /// The <see cref="IMembershipManager"/> models the lifecycle of people's connection with CareTogether,
    /// including user sign-up, profile management, and user deletion, as well as authorizing related queries.
    /// </summary>
    public interface IMembershipManager
    {
        Task<ManagerResult<ContactInfo>> GetContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, Guid personId);

        Task<ManagerResult<ContactInfo>> UpdateContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, ContactCommand command);

        Task<ManagerResult<IImmutableList<Person>>> QueryPeopleAsync(AuthorizedUser user, Guid organizationId, Guid locationId, string searchQuery);

        Task<ManagerResult<Family>> ExecuteFamilyCommandAsync(AuthorizedUser user, Guid organizationId, Guid locationId, FamilyCommand command);
    }
}
