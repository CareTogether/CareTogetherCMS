using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class MembershipManager : IMembershipManager
    {
        private readonly ICommunitiesResource communitiesResource;
        private readonly IProfilesResource profilesResource;


        public MembershipManager(ICommunitiesResource communitiesResource, IProfilesResource profilesResource)
        {
            this.communitiesResource = communitiesResource;
            this.profilesResource = profilesResource;
        }


        public async Task<ManagerResult<ContactInfo>> GetContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, Guid personId)
        {
            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                (user.PersonId == personId || user.IsInRole(Roles.OrganizationAdministrator)))
                return await profilesResource.FindUserContactInfoAsync(organizationId, locationId, personId);
            else
                return ManagerResult.NotAllowed;
        }

        public async Task<ManagerResult<ContactInfo>> UpdateContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, ContactCommand command)
        {
            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                ((command is not CreateContact && user.PersonId == command.PersonId) || user.IsInRole(Roles.OrganizationAdministrator)))
                return await profilesResource.ExecuteContactCommandAsync(organizationId, locationId, command);
            else
                return ManagerResult.NotAllowed;
        }

        public async IAsyncEnumerable<Person> QueryPeopleAsync(AuthorizedUser user, Guid organizationId, Guid locationId, string searchQuery)
        {
            //TODO: This is just a demo implementation of a business rule, not a true business rule.
            if (user.CanAccess(organizationId, locationId) &&
                user.IsInRole(Roles.OrganizationAdministrator))
                await foreach (var person in communitiesResource.FindPeople(organizationId, locationId, searchQuery))
                    yield return person;
            else
                yield break;
        }
    }
}
