using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    /// <summary>
    /// The <see cref="IMembershipManager"/> models the lifecycle of people's connection with CareTogether,
    /// including user sign-up, profile management, and user deletion, as well as authorizing related queries.
    /// </summary>
    public interface IMembershipManager
    {
        Task<ContactInfo> GetContactInfoAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, Guid personId);

        Task<ContactInfo> UpdateContactInfoAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, ContactCommand command);

        Task<ImmutableList<Person>> QueryPeopleAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, string searchQuery);

        Task<Family> ExecuteFamilyCommandAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, FamilyCommand command);
    }
}
