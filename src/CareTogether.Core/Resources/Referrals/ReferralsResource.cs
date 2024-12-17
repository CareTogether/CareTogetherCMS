using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Referrals
{
    public sealed class ReferralsResource : IReferralsResource
    {
        readonly IEventLog<ReferralEvent> _EventLog;
        readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel> _TenantModels;

        public ReferralsResource(IEventLog<ReferralEvent> eventLog)
        {
            _EventLog = eventLog;
            _TenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel>(key =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId))
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ReferralModel
                >.LockedItem<ReferralModel> lockedModel = await _TenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (
                    ReferralCommandExecuted Event,
                    long SequenceNumber,
                    ReferralEntry ReferralEntry,
                    Action OnCommit
                ) result = lockedModel.Value.ExecuteReferralCommand(command, userId, DateTime.UtcNow);

                await _EventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ReferralModel
                >.LockedItem<ReferralModel> lockedModel = await _TenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (
                    ArrangementsCommandExecuted Event,
                    long SequenceNumber,
                    ReferralEntry ReferralEntry,
                    Action OnCommit
                ) result = lockedModel.Value.ExecuteArrangementsCommand(command, userId, DateTime.UtcNow);

                await _EventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.ReferralEntry;
            }
        }

        public async Task<ImmutableList<ReferralEntry>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ReferralModel
                >.LockedItem<ReferralModel> lockedModel = await _TenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindReferralEntries(_ => true);
            }
        }

        public async Task<ReferralEntry> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId)
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ReferralModel
                >.LockedItem<ReferralModel> lockedModel = await _TenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.GetReferralEntry(referralId);
            }
        }
    }
}
