using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.OrganizationApprovals
{
    public sealed class OrganizationApprovalsResource : IOrganizationApprovalsResource
    {
        private readonly IEventLog<OrganizationApprovalEvent> eventLog;
        private readonly ConcurrentLockingStore<
            (Guid tenantId, Guid locationId),
            OrganizationApprovalModel
        > tenantModels;

        public OrganizationApprovalsResource(IEventLog<OrganizationApprovalEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid tenantId, Guid locationId),
                OrganizationApprovalModel
            >(key =>
                OrganizationApprovalModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.tenantId, key.locationId)
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
            await eventLog.AppendEventAsync(
                tenantId,
                locationId,
                result.Event,
                result.SequenceNumber
            );
            result.OnCommit();
            return result.Entry;
        }
    }
}
