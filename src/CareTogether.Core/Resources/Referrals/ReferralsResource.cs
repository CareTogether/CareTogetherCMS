using System;
using System.Collections.Immutable;
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

        public V1CasesResource(IEventLog<V1CaseEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1CaseModel
            >(key =>
                V1CaseModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
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

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
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

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
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

        public async Task<V1CaseEntry> GetV1CaseAsync(
            Guid organizationId,
            Guid locationId,
            Guid v1CaseId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetV1CaseEntry(v1CaseId);
            }
        }
    }
}
