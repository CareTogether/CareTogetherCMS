using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Directory
{
    public sealed class DirectoryResource : IDirectoryResource
    {
        private readonly IMultitenantEventLog<DirectoryEvent> eventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), DirectoryModel> tenantModels;


        public DirectoryResource(IMultitenantEventLog<DirectoryEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), DirectoryModel>(key =>
                DirectoryModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<Family> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId,
            FamilyCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteFamilyCommand(command, userId, DateTime.UtcNow);
                
                await eventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Family;
            }
        }

        public async Task<Person> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            PersonCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecutePersonCommand(command, userId, DateTime.UtcNow);
                
                await eventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Person;
            }
        }

        public async Task<ImmutableList<Person>> ListPeopleAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindPeople(p => true);
            }
        }

        public async Task<Person> FindUserAsync(Guid organizationId, Guid locationId, Guid userId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindPeople(p => p.UserId == userId);
                return result.Single();
                //TODO: Handle the exception case where multiple people have the same user ID assigned, or
                //      protect against that scenario in the domain model.
            }
        }

        public async Task<ImmutableList<Family>> ListFamiliesAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindFamilies(f => true);
            }
        }

        public async Task<Family> FindFamilyAsync(Guid organizationId, Guid locationId, Guid familyId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindFamilies(f => f.Id == familyId);
                return result.Single();
            }
        }

        public async Task<Family?> FindPersonFamilyAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindFamilies(f => f.Adults.Exists(a => a.Item1.Id == personId));
                return result.SingleOrDefault(); //TODO: Should this be tightened down to always have a value?
            }
        }
    }
}
