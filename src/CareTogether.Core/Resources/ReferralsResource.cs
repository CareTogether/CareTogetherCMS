using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ReferralsResource : IReferralsResource
    {
        private readonly IMultitenantEventLog<ReferralEvent> eventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel> tenantModels;


        public ReferralsResource(IMultitenantEventLog<ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel>(key =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<ReferralEntry> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ReferralCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteReferralCommand(command, userId, DateTime.UtcNow);
                
                await eventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.ReferralEntry;
            }
        }

        public async Task<ReferralEntry> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ArrangementCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteArrangementCommand(command, userId, DateTime.UtcNow);
                
                await eventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.ReferralEntry;
            }
        }

        public async Task<ImmutableList<ReferralEntry>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindReferralEntries(_ => true);
            }
        }

        public async Task<ReferralEntry> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.GetReferralEntry(referralId);
            }
        }
    }
}
