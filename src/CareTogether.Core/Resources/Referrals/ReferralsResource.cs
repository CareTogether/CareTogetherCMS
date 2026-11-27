using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.V1Cases
{
    public sealed class V1CasesResource : IV1CasesResource
    {
        private readonly IEventLog<V1CaseEvent> eventLog;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1CaseModel
        > tenantModels;
        private readonly ConcurrentDictionary<
            (Guid organizationId, Guid locationId),
            EventLogPosition?
        > tenantPositions = new();

        public V1CasesResource(IEventLog<V1CaseEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1CaseModel
            >(key =>
                V1CaseModel.InitializeAsync(
                    eventLog is AppendBlobEventLog<V1CaseEvent> blobLog
                        ? blobLog.GetAllEventsAsync(
                            key.organizationId,
                            key.locationId,
                            position => tenantPositions[key] = position
                        )
                        : eventLog.GetAllEventsAsync(key.organizationId, key.locationId),
                    (key.organizationId, key.locationId)
                )
            );
        }

        internal async Task<EventLogPosition?> GetReplayPositionAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using var lockedModel = await tenantModels.ReadLockItemAsync(
                (organizationId, locationId)
            );
            return tenantPositions.TryGetValue((organizationId, locationId), out var position)
                ? position
                : null;
        }

        internal async Task<long?> VerifyReplayPositionAsync(
            Guid organizationId,
            Guid locationId,
            EventLogPosition captured
        )
        {
            if (
                eventLog is not AppendBlobEventLog<V1CaseEvent> blobLog
                || await GetReplayPositionAsync(organizationId, locationId) != captured
            )
                return null;

            return await blobLog.IsCurrentAsync(organizationId, locationId, captured)
                ? captured.EventCount
                : null;
        }

        private async Task CommitAsync(
            (Guid organizationId, Guid locationId) key,
            V1CaseEvent domainEvent,
            long sequenceNumber,
            Action onCommit
        )
        {
            if (eventLog is not AppendBlobEventLog<V1CaseEvent> blobLog)
            {
                await eventLog.AppendEventAsync(
                    key.organizationId,
                    key.locationId,
                    domainEvent,
                    sequenceNumber
                );
                onCommit();
                return;
            }

            tenantPositions.TryRemove(key, out var known);
            var position = await blobLog.AppendEventAsync(
                key.organizationId,
                key.locationId,
                domainEvent,
                sequenceNumber,
                known
            );
            onCommit();
            tenantPositions[key] = position;
        }

        public async Task<V1CaseEntry> ExecuteV1CaseCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1CaseCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteV1CaseCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await CommitAsync(
                    (organizationId, locationId),
                    result.Event,
                    result.SequenceNumber,
                    result.OnCommit
                );
                return result.V1CaseEntry;
            }
        }

        public async Task<V1CaseEntry> ExecuteArrangementsCommandAsync(
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

                await CommitAsync(
                    (organizationId, locationId),
                    result.Event,
                    result.SequenceNumber,
                    result.OnCommit
                );
                return result.V1CaseEntry;
            }
        }

        public async Task<ImmutableList<V1CaseEntry>> ListV1CasessAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindV1CaseEntries(_ => true);
            }
        }

        public async Task<ImmutableList<V1CaseEntry>> ListV1CasesForFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetV1CaseEntriesForFamily(familyId);
            }
        }

        public async Task<ImmutableList<V1CaseEntry>> ListV1CasesAssignedToVolunteerFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid volunteerFamilyId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetV1CaseEntriesAssignedToVolunteerFamily(
                    volunteerFamilyId
                );
            }
        }
    }
}
