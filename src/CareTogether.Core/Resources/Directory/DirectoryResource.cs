using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;

namespace CareTogether.Resources.Directory
{
    public sealed class DirectoryResource : IDirectoryResource
    {
        private readonly IEventLog<DirectoryEvent> eventLog;
        private readonly IFileStore fileStore;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), DirectoryModel> tenantModels;

        public DirectoryResource(IEventLog<DirectoryEvent> eventLog, IFileStore fileStore)
        {
            this.eventLog = eventLog;
            this.fileStore = fileStore;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), DirectoryModel>(key =>
                DirectoryModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId))
            );
        }

        public async Task<Family> ExecuteFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            FamilyCommand command,
            Guid userId
        )
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteFamilyCommand(command, userId, DateTime.UtcNow);

                await eventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Family;
            }
        }

        public async Task<Person> ExecutePersonCommandAsync(
            Guid organizationId,
            Guid locationId,
            PersonCommand command,
            Guid userId
        )
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

        public async Task<ImmutableList<Family>> ListFamiliesAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindFamilies(f => true);
            }
        }

        public async Task<Family?> FindFamilyAsync(Guid organizationId, Guid locationId, Guid familyId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindFamilies(f => f.Id == familyId);
                return result.SingleOrDefault();
            }
        }

        public async Task<Family?> FindPersonFamilyAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindFamilies(f =>
                    f.Adults.Exists(a => a.Item1.Id == personId) || f.Children.Exists(c => c.Id == personId)
                );
                return result.SingleOrDefault(); //TODO: Should this be tightened down to always have a value?
            }
        }

        public async Task<Uri> GetFamilyDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid documentId
        )
        {
            var family = await FindFamilyAsync(organizationId, locationId, familyId);
            if (
                family == null
                || !family.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
                || family.DeletedDocuments.Any(doc => doc == documentId)
            )
                throw new Exception("The specified family document does not exist.");

            //TODO: Concatenate 'family-' and the family ID with the 'documentId' itself to prevent hostile overwrites
            //      (requires a data migration; could use an existence check in the interim)
            var valetUrl = await fileStore.GetValetReadUrlAsync(organizationId, locationId, documentId);

            return valetUrl;
        }

        public async Task<Uri> GetFamilyDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid documentId
        )
        {
            var family = await FindFamilyAsync(organizationId, locationId, familyId);
            if (family == null || family.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId))
                throw new Exception("The specified family document already exists.");

            //TODO: Concatenate 'family-' and the family ID with the 'documentId' itself to prevent hostile overwrites
            //      (requires a data migration; could use an existence check in the interim)
            var valetUrl = await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);

            return valetUrl;
        }
    }
}
