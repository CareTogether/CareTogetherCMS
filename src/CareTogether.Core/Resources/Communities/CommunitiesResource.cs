using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;

namespace CareTogether.Resources.Communities
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        readonly IEventLog<CommunityCommandExecutedEvent> _CommunitiesEventLog;
        readonly IFileStore _FileStore;

        readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            CommunitiesModel
        > _TenantCommunitiesModels;

        public CommunitiesResource(IEventLog<CommunityCommandExecutedEvent> communitiesEventLog, IFileStore fileStore)
        {
            _CommunitiesEventLog = communitiesEventLog;
            _FileStore = fileStore;
            _TenantCommunitiesModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                CommunitiesModel
            >(key =>
                CommunitiesModel.InitializeAsync(
                    communitiesEventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task<Community> ExecuteCommunityCommandAsync(
            Guid organizationId,
            Guid locationId,
            CommunityCommand command,
            Guid userId
        )
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    CommunitiesModel
                >.LockedItem<CommunitiesModel> lockedModel = await _TenantCommunitiesModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (
                    CommunityCommandExecutedEvent Event,
                    long SequenceNumber,
                    Community Community,
                    Action OnCommit
                ) result = lockedModel.Value.ExecuteCommunityCommand(command, userId, DateTime.UtcNow);

                await _CommunitiesEventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.Community;
            }
        }

        public async Task<ImmutableList<Community>> ListLocationCommunitiesAsync(Guid organizationId, Guid locationId)
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    CommunitiesModel
                >.LockedItem<CommunitiesModel> lockedModel = await _TenantCommunitiesModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindCommunities(c => true);
            }
        }

        public async Task<Uri> GetCommunityDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            Community? community = await FindCommunityAsync(organizationId, locationId, communityId);
            if (community == null || !community.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId))
            {
                throw new InvalidOperationException("The specified community document does not exist.");
            }

            string documentSubpath = GetCommunityDocumentSubpath(communityId, documentId);

            Uri valetUrl = await _FileStore.GetValetReadUrlAsync(organizationId, locationId, documentSubpath);

            return valetUrl;
        }

        public async Task<Uri> GetCommunityDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            Community? community = await FindCommunityAsync(organizationId, locationId, communityId);
            if (community == null || community.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId))
            {
                throw new InvalidOperationException("The specified community document already exists.");
            }

            string documentSubpath = GetCommunityDocumentSubpath(communityId, documentId);

            Uri valetUrl = await _FileStore.GetValetCreateUrlAsync(organizationId, locationId, documentSubpath);

            return valetUrl;
        }

        public async Task<Community?> FindCommunityAsync(Guid organizationId, Guid locationId, Guid communityId)
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    CommunitiesModel
                >.LockedItem<CommunitiesModel> lockedModel = await _TenantCommunitiesModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                ImmutableList<Community> result = lockedModel.Value.FindCommunities(f => f.Id == communityId);
                return result.SingleOrDefault();
            }
        }

        static string GetCommunityDocumentSubpath(Guid communityId, Guid documentId)
        {
            // Build a concatenated path to ensure uploads for different communities stay separate
            return $"community/{communityId}/{documentId}";
        }
    }
}
