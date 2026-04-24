using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralsResource : IV1ReferralsResource
    {
        private readonly IEventLog<V1ReferralEvent> eventLog;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1ReferralModel
        > tenantModels;

        public V1ReferralsResource(IEventLog<V1ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1ReferralModel
            >(key =>
                V1ReferralModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId))
            )
            {
                var result = lockedModel.Value.ExecuteReferralCommand(
                    command,
                    actorUserId,
                    DateTime.UtcNow
                );

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
            }
        }

        public async Task<V1Referral?> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetReferral(referralId);
            }
        }

        public async Task<ImmutableList<V1Referral>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindReferrals(_ => true);
            }
        }
    }
}
