using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Notes
{
    public sealed class NotesResource : INotesResource
    {
        private readonly IMultitenantEventLog<NotesEvent> eventLog;
        private readonly IObjectStore<string?> draftNotesStore;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), NotesModel> tenantModels;


        public NotesResource(IMultitenantEventLog<NotesEvent> eventLog, IObjectStore<string?> draftNotesStore)
        {
            this.eventLog = eventLog;
            this.draftNotesStore = draftNotesStore;
            tenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), NotesModel>(key =>
                NotesModel.InitializeAsync(eventLog.GetAllEventsAsync(key.organizationId, key.locationId),
                    async noteId =>
                    {
                        var draftNote = await draftNotesStore.GetAsync(key.organizationId, key.locationId, noteId.ToString());
                        return draftNote;
                    }));
        }


        public async Task<NoteEntry?> ExecuteNoteCommandAsync(Guid organizationId, Guid locationId,
            NoteCommand command, Guid userId)
        {
            using (var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteNoteCommand(command, userId, DateTime.UtcNow);

                // We do not want to commit draft note contents to the immutable event log.
                // Only approved note contents should be committed, which means that draft note contents need to
                // be stored separately. In this case, we use a key-value store and delete drafts once they are
                // no longer needed (i.e., when the draft note is either discarded or approved).
                // As a result of using multiple backends, there is a potential for partial failure, which we
                // mitigate by focusing on preserving committed or to-be-committed data; drafts are less critical.

                var redactedEventToPersist = result.Event with
                {
                    Command = result.Event.Command
                        switch
                    {
                        CreateDraftNote e => e with { DraftNoteContents = null },
                        EditDraftNote e => e with { DraftNoteContents = null },
                        _ => result.Event.Command
                    }
                };
                await eventLog.AppendEventAsync(organizationId, locationId, redactedEventToPersist, result.SequenceNumber);
                result.OnCommit();

                switch (result.Event.Command)
                {
                    case CreateDraftNote c:
                        await draftNotesStore.UpsertAsync(organizationId, locationId, command.NoteId.ToString(), c.DraftNoteContents);
                        break;
                    case EditDraftNote c:
                        await draftNotesStore.UpsertAsync(organizationId, locationId, command.NoteId.ToString(), c.DraftNoteContents);
                        break;
                    case DiscardDraftNote:
                    case ApproveNote:
                        await draftNotesStore.DeleteAsync(organizationId, locationId, command.NoteId.ToString());
                        break;
                }

                return result.NoteEntry;
            }
        }

        public async Task<ImmutableList<NoteEntry>> ListFamilyNotesAsync(Guid organizationId, Guid locationId, Guid familyId)
        {
            using (var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindNoteEntries(note => note.FamilyId == familyId);
            }
        }
    }
}
