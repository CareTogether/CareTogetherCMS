using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class MembershipManager : IMembershipManager
    {
        private readonly ICommunitiesResource communitiesResource;
        private readonly IContactsResource profilesResource;


        public MembershipManager(ICommunitiesResource communitiesResource, IContactsResource profilesResource)
        {
            this.communitiesResource = communitiesResource;
            this.profilesResource = profilesResource;
        }


        public async Task<ContactInfo> GetContactInfoAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, Guid personId)
        {
            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                (user.PersonId() == personId || user.IsInRole(Roles.OrganizationAdministrator)))
                return await profilesResource.FindUserContactInfoAsync(organizationId, locationId, personId);
            else
                throw new Exception("That action is not allowed");
        }

        public async Task<ContactInfo> UpdateContactInfoAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, ContactCommand command)
        {
            command = command switch
            {
                CreateContact c => c with { PersonId = Guid.NewGuid() },
                _ => command
            };

            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                ((command is not CreateContact && user.PersonId() == command.PersonId) || user.IsInRole(Roles.OrganizationAdministrator)))
                return await profilesResource.ExecuteContactCommandAsync(organizationId, locationId, command, user.UserId());
            else
                throw new Exception("That action is not allowed");
        }

        public async Task<ImmutableList<Person>> QueryPeopleAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, string searchQuery)
        {
            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                user.IsInRole(Roles.OrganizationAdministrator))
            {
                var people = await communitiesResource.ListPeopleAsync(organizationId, locationId); //TODO: Actually query.
                return people.ToImmutableList();
            }
            else
                throw new Exception("That action is not allowed");
        }

        public async Task<Family> ExecuteFamilyCommandAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId, FamilyCommand command)
        {
            command = command switch
            {
                CreateFamily c => c with { FamilyId = Guid.NewGuid() },
                _ => command
            };

            return await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId, command, user.UserId());
        }
    }
}
