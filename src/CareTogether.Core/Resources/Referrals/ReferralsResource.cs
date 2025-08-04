using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.V1Cases
{
    public sealed class ReferralsResource : IReferralsResource
    {
        private readonly IEventLog<ReferralEvent> eventLog;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            ReferralModel
        > tenantModels;

        public ReferralsResource(IEventLog<ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                ReferralModel
            >(key =>
                ReferralModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task<ReferralEntry> ExecuteReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            ReferralCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteReferralCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.ReferralEntry;
            }
        }

        public async Task<ReferralEntry> ExecuteArrangementsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ArrangementsCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteArrangementsCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.ReferralEntry;
            }
        }

        public async Task<ImmutableList<ReferralEntry>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindReferralEntries(_ => true);
            }
        }

        public async Task<ReferralEntry> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetReferralEntry(referralId);
            }
        }
    }
}
