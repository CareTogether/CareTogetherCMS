using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Approvals
{
    public sealed class ApprovalsResource : IApprovalsResource
    {
        private readonly TrackedEventStream<ApprovalEvent> stream;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            ApprovalModel
        > tenantModels;

        public ApprovalsResource(IEventLog<ApprovalEvent> eventLog)
        {
            stream = new TrackedEventStream<ApprovalEvent>(
                eventLog,
                domainEvent =>
                    domainEvent switch
                    {
                        VolunteerFamilyCommandExecuted e => e.Command.FamilyId,
                        VolunteerCommandExecuted e => e.Command.FamilyId,
                        _ => (Guid?)null,
                    }
            );
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                ApprovalModel
            >(key =>
                ApprovalModel.InitializeAsync(
                    stream.ReplayAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task<VolunteerFamilyEntry> ExecuteVolunteerCommandAsync(
            Guid organizationId,
            Guid locationId,
            VolunteerCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteVolunteerCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await stream.CommitAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber,
                    result.OnCommit
                );
                return result.VolunteerFamilyEntry;
            }
        }

        public async Task<VolunteerFamilyEntry> ExecuteVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            VolunteerFamilyCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteVolunteerFamilyCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await stream.CommitAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber,
                    result.OnCommit
                );
                return result.VolunteerFamilyEntry;
            }
        }

        public async Task<VolunteerFamilyEntry?> TryGetVolunteerFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetVolunteerFamilyEntry(familyId);
            }
        }

        public async Task<ImmutableList<VolunteerFamilyEntry>> ListVolunteerFamiliesAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindVolunteerFamilyEntries(_ => true);
            }
        }

        internal async Task<EventStreamSnapshot?> CaptureStreamAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using var lockedModel = await tenantModels.ReadLockItemAsync(
                (organizationId, locationId)
            );
            return stream.Current(organizationId, locationId);
        }

        internal async Task<bool> VerifyStreamAsync(
            Guid organizationId,
            Guid locationId,
            EventStreamSnapshot captured
        ) =>
            ReferenceEquals(await CaptureStreamAsync(organizationId, locationId), captured)
            && await stream.IsCurrentAsync(organizationId, locationId, captured);
    }
}
