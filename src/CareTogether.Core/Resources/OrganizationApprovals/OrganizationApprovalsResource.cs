using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.OrganizationApprovals
{
    public sealed class OrganizationApprovalsResource : IOrganizationApprovalsResource
    {
        private readonly TrackedEventStream<OrganizationApprovalEvent> stream;
        private readonly ConcurrentLockingStore<
            (Guid tenantId, Guid locationId),
            OrganizationApprovalModel
        > tenantModels;

        public OrganizationApprovalsResource(IEventLog<OrganizationApprovalEvent> eventLog)
        {
            stream = new TrackedEventStream<OrganizationApprovalEvent>(
                eventLog,
                domainEvent =>
                    domainEvent is OrganizationApprovalCommandExecuted e
                        ? e.Command.OrganizationId
                        : null
            );
            tenantModels = new ConcurrentLockingStore<
                (Guid tenantId, Guid locationId),
                OrganizationApprovalModel
            >(key =>
                OrganizationApprovalModel.InitializeAsync(
                    stream.ReplayAsync(key.tenantId, key.locationId)
                )
            );
        }

        public async Task<ImmutableList<OrganizationApprovalEntry>> ListAsync(
            Guid tenantId,
            Guid locationId
        )
        {
            using var lockedModel = await tenantModels.ReadLockItemAsync((tenantId, locationId));
            return lockedModel.Value.List();
        }

        public async Task<OrganizationApprovalEntry?> TryGetAsync(
            Guid tenantId,
            Guid locationId,
            Guid organizationId
        )
        {
            using var lockedModel = await tenantModels.ReadLockItemAsync((tenantId, locationId));
            return lockedModel.Value.TryGet(organizationId);
        }

        public async Task<OrganizationApprovalEntry> ExecuteCommandAsync(
            Guid tenantId,
            Guid locationId,
            OrganizationApprovalCommand command,
            Guid userId
        )
        {
            using var lockedModel = await tenantModels.WriteLockItemAsync((tenantId, locationId));
            var result = lockedModel.Value.ExecuteCommand(command, userId, DateTime.UtcNow);
            await stream.CommitAsync(
                tenantId,
                locationId,
                result.Event,
                result.SequenceNumber,
                result.OnCommit
            );
            return result.Entry;
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
