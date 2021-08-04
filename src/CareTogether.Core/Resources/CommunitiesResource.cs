using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        private readonly IMultitenantEventLog<CommunityEvent> eventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), CommunityModel> tenantModels;


        public CommunitiesResource(IMultitenantEventLog<CommunityEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), CommunityModel>(key =>
                CommunityModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId,
            FamilyCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteFamilyCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.Family;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ResourceResult<Person>> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            PersonCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecutePersonCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.Person;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableList<Person>> FindPeopleAsync(Guid organizationId, Guid locationId, string partialFirstOrLastName)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindPeople(p =>
                    p.FirstName.Contains(partialFirstOrLastName) || p.LastName.Contains(partialFirstOrLastName));
            }
        }

        public async Task<ResourceResult<Person>> FindUserAsync(Guid organizationId, Guid locationId, Guid userId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindPeople(p => p.UserId == userId);
                if (result.Count == 1)
                    return result.Single();
                else
                    //TODO: Handle the exception case where multiple people have the same user ID assigned, or
                    //      protect against that scenario in the domain model.
                    return ResourceResult.NotFound;
            }
        }

        public async Task<ImmutableList<Family>> ListPartneringFamilies(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindFamilies(f =>
                    f.PartneringFamilyStatus == PartneringFamilyStatus.Active ||
                    f.PartneringFamilyStatus == PartneringFamilyStatus.Inactive);
            }
        }

        public async Task<ImmutableList<Family>> ListVolunteerFamilies(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindFamilies(f =>
                    f.VolunteerFamilyStatus == VolunteerFamilyStatus.Active ||
                    f.VolunteerFamilyStatus == VolunteerFamilyStatus.Inactive);
            }
        }
    }
}
