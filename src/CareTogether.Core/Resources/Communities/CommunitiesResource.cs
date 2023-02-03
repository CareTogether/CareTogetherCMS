using CareTogether.Utilities.EventLog;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Communities
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        private readonly IEventLog<CommunityCommandExecutedEvent> communitiesEventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), CommunitiesModel> tenantCommunitiesModels;


        public CommunitiesResource(IEventLog<CommunityCommandExecutedEvent> communitiesEventLog)
        {
            this.communitiesEventLog = communitiesEventLog;
            tenantCommunitiesModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), CommunitiesModel>(key =>
                CommunitiesModel.InitializeAsync(communitiesEventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<Community> ExecuteCommunityCommandAsync(Guid organizationId, Guid locationId, CommunityCommand command,
            Guid userId)
        {
            using (var lockedModel = await tenantCommunitiesModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteCommunityCommand(command, userId, DateTime.UtcNow);

                await communitiesEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Community;
            }
        }

        public async Task<ImmutableList<Community>> ListLocationCommunitiesAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantCommunitiesModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindCommunities(c => true);
            }
        }
    }
}
