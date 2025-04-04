﻿using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Approvals
{
    public sealed class ApprovalsResource : IApprovalsResource
    {
        private readonly IEventLog<ApprovalEvent> eventLog;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            ApprovalModel
        > tenantModels;

        public ApprovalsResource(IEventLog<ApprovalEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                ApprovalModel
            >(key =>
                ApprovalModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
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

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
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

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
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
    }
}
