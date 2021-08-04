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
    public sealed class ReferralsResource : IReferralsResource
    {
        private readonly IMultitenantEventLog<ReferralEvent> eventLog;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncReaderWriterLock> tenantLocks = new();
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<ReferralModel>> tenantModels = new();


        public ReferralsResource(IMultitenantEventLog<ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
        }


        public async Task<ResourceResult<ReferralEntry>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ReferralCommand command, Guid userId)
        {
            //TODO: Consolidate into a single 'TenantModelWithWriterLock' or 'TenantModelWithReaderLock'?
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var result = tenantModel.ExecuteReferralCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.ReferralEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ResourceResult<ReferralEntry>> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ArrangementCommand command, Guid userId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var result = tenantModel.ExecuteArrangementCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.ReferralEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ResourceResult<ReferralEntry>> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ArrangementNoteCommand command, Guid userId)
        {
            //TODO: Incorporate other notes handling (draft/permanent storage)

            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var result = tenantModel.ExecuteArrangementNoteCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.ReferralEntry;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableList<ReferralEntry>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                return tenantModel.FindReferralEntries(_ => true);
            }
        }


        private async Task<ReferralModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ReferralModel>(() =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }
    }
}
