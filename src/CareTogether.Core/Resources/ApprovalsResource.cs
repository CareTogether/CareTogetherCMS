using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ApprovalsResource : IApprovalsResource
    {
        private readonly IMultitenantEventLog<ApprovalEvent> eventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ApprovalModel> tenantModels;
        

        public ApprovalsResource(IMultitenantEventLog<ApprovalEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ApprovalModel>(key =>
                ApprovalModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            VolunteerCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteVolunteerCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.VolunteerFamilyEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteVolunteerFamilyCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.VolunteerFamilyEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableList<VolunteerFamilyEntry>> ListVolunteerFamiliesAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindVolunteerFamilyEntries(_ => true);
            }
        }
    }
}
