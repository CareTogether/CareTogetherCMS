using CareTogether.Resources;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class MembershipManager : IMembershipManager
    {
        private readonly ICommunitiesResource communitiesResource;
        private readonly IProfilesResource profilesResource;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncReaderWriterLock> tenantLocks = new();


        public MembershipManager(ICommunitiesResource communitiesResource, IProfilesResource profilesResource)
        {
            this.communitiesResource = communitiesResource;
            this.profilesResource = profilesResource;
        }


        public async Task<ManagerResult<ContactInfo>> GetContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, Guid personId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                //TODO: This is just a demo implementation of a business rule, not a true business rule.
                if (user.CanAccess(organizationId, locationId) &&
                (user.PersonId == personId || user.IsInRole(Roles.OrganizationAdministrator)))
                    return await profilesResource.FindUserContactInfoAsync(organizationId, locationId, personId);
                else
                    return ManagerResult.NotAllowed;
            }
        }

        public async Task<ManagerResult<ContactInfo>> UpdateContactInfoAsync(AuthorizedUser user, Guid organizationId, Guid locationId, ContactCommand command)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                //TODO: This is just a demo implementation of a business rule, not a true business rule.
                if (user.CanAccess(organizationId, locationId) &&
                ((command is not CreateContact && user.PersonId == command.PersonId) || user.IsInRole(Roles.OrganizationAdministrator)))
                    return await profilesResource.ExecuteContactCommandAsync(organizationId, locationId, command);
                else
                    return ManagerResult.NotAllowed;
            }
        }

        public async Task<ManagerResult<IImmutableList<Person>>> QueryPeopleAsync(AuthorizedUser user, Guid organizationId, Guid locationId, string searchQuery)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                //TODO: This is just a demo implementation of a business rule, not a true business rule.
                if (user.CanAccess(organizationId, locationId) &&
                user.IsInRole(Roles.OrganizationAdministrator))
                {
                    var people = await communitiesResource.FindPeopleAsync(organizationId, locationId, searchQuery);
                    return people.ToImmutableList();
                }
                else
                    return ManagerResult.NotAllowed;
            }
        }
    }
}
