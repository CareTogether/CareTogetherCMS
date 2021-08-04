using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ApprovalsResource : IApprovalsResource
    {
        private readonly IMultitenantEventLog<ApprovalEvent> eventLog;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncReaderWriterLock> tenantLocks = new();
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<ApprovalModel>> tenantModels = new();


        public ApprovalsResource(IMultitenantEventLog<ApprovalEvent> eventLog)
        {
            this.eventLog = eventLog;
        }


        public async Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            VolunteerCommand command, Guid userId)
        {
            //TODO: Consolidate into a single 'TenantModelWithWriterLock' or 'TenantModelWithReaderLock'?
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var result = tenantModel.ExecuteVolunteerCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.VolunteerFamilyEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyCommand command, Guid userId)
        {
            //TODO: Consolidate into a single 'TenantModelWithWriterLock' or 'TenantModelWithReaderLock'?
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var result = tenantModel.ExecuteVolunteerFamilyCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.VolunteerFamilyEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableList<VolunteerFamilyEntry>> ListVolunteerFamiliesAsync(Guid organizationId, Guid locationId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                return tenantModel.FindVolunteerFamilyEntries(_ => true);
            }
        }


        private async Task<ApprovalModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ApprovalModel>(() =>
                ApprovalModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }
    }
}
