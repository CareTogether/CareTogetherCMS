using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Approvals
{
    public sealed class ApprovalsResource : IApprovalsResource
    {
        readonly IEventLog<ApprovalEvent> _EventLog;
        readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ApprovalModel> _TenantModels;

        public ApprovalsResource(IEventLog<ApprovalEvent> eventLog)
        {
            _EventLog = eventLog;
            _TenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ApprovalModel>(key =>
                ApprovalModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId))
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ApprovalModel
                >.LockedItem<ApprovalModel> lockedModel = await _TenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (
                    VolunteerCommandExecuted Event,
                    long SequenceNumber,
                    VolunteerFamilyEntry VolunteerFamilyEntry,
                    Action OnCommit
                ) result = lockedModel.Value.ExecuteVolunteerCommand(command, userId, DateTime.UtcNow);

                await _EventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ApprovalModel
                >.LockedItem<ApprovalModel> lockedModel = await _TenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (
                    VolunteerFamilyCommandExecuted Event,
                    long SequenceNumber,
                    VolunteerFamilyEntry VolunteerFamilyEntry,
                    Action OnCommit
                ) result = lockedModel.Value.ExecuteVolunteerFamilyCommand(command, userId, DateTime.UtcNow);

                await _EventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ApprovalModel
                >.LockedItem<ApprovalModel> lockedModel = await _TenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
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
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    ApprovalModel
                >.LockedItem<ApprovalModel> lockedModel = await _TenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindVolunteerFamilyEntries(_ => true);
            }
        }
    }
}
