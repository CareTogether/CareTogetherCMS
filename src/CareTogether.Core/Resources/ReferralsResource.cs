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
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel> tenantModels;


        public ReferralsResource(IMultitenantEventLog<ReferralEvent> eventLog)
        {
            this.eventLog = eventLog;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel>(key =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<ResourceResult<ReferralEntry>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ReferralCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteReferralCommand(command, userId, DateTime.UtcNow);
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
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteArrangementCommand(command, userId, DateTime.UtcNow);
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

            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteArrangementNoteCommand(command, userId, DateTime.UtcNow);
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
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindReferralEntries(_ => true);
            }
        }
    }
}
