using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ReferralsResource : IReferralsResource
    {
        private readonly IMultitenantEventLog<ReferralEvent> eventLog;
        private readonly IObjectStore<string> draftNotesStore;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel> tenantModels;


        public ReferralsResource(IMultitenantEventLog<ReferralEvent> eventLog, IObjectStore<string> draftNotesStore)
        {
            this.eventLog = eventLog;
            this.draftNotesStore = draftNotesStore;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ReferralModel>(key =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId),
                    async noteId =>
                    {
                        var draftNoteResult = await draftNotesStore.GetAsync(key.organizationId, key.locationId, noteId.ToString());
                        return draftNoteResult.TryPickT0(out var draftNote, out var _)
                            ? draftNote.Value
                            : null; //TODO: Log/return an error that the draft note could not be found!
                    }));
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
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteArrangementNoteCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    // We do not want to commit draft note contents to the immutable event log.
                    // Only approved note contents should be committed, which means that draft note contents need to
                    // be stored separately. In this case, we use a key-value store and delete drafts once they are
                    // no longer needed (i.e., when the draft note is either discarded or approved).
                    // As a result of using multiple backends, there is a potential for partial failure, which we
                    // mitigate by focusing on preserving committed or to-be-committed data; drafts are less critical.

                    var redactedEventToPersist = success.Value.Event with
                    {
                        Command = success.Value.Event.Command
                            switch
                        {
                            CreateDraftArrangementNote e => e with { DraftNoteContents = null },
                            EditDraftArrangementNote e => e with { DraftNoteContents = null },
                            _ => success.Value.Event.Command
                        }
                    };
                    await eventLog.AppendEventAsync(organizationId, locationId, redactedEventToPersist, success.Value.SequenceNumber);
                    success.Value.OnCommit();

                    switch (success.Value.Event.Command)
                    {
                        case CreateDraftArrangementNote c:
                            await draftNotesStore.UpsertAsync(organizationId, locationId, command.NoteId.ToString(), c.DraftNoteContents);
                            break;
                        case EditDraftArrangementNote c:
                            await draftNotesStore.UpsertAsync(organizationId, locationId, command.NoteId.ToString(), c.DraftNoteContents);
                            break;
                        case DiscardDraftArrangementNote:
                        case ApproveArrangementNote:
                            await draftNotesStore.DeleteAsync(organizationId, locationId, command.NoteId.ToString());
                            break;
                    }

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

        public async Task<ResourceResult<ReferralEntry>> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.GetReferralEntry(referralId);
            }
        }
    }
}
