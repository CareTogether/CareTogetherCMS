using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Resources.Notes
{
    public sealed class NotesResource : INotesResource
    {
        readonly IObjectStore<string?> _DraftNotesStore;
        readonly IEventLog<NotesEvent> _EventLog;
        readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), NotesModel> _TenantModels;

        public NotesResource(IEventLog<NotesEvent> eventLog, IObjectStore<string?> draftNotesStore)
        {
            _EventLog = eventLog;
            _DraftNotesStore = draftNotesStore;
            _TenantModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), NotesModel>(key =>
                NotesModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId),
                    async noteId =>
                    {
                        string? draftNote = await draftNotesStore.GetAsync(
                            key.organizationId,
                            key.locationId,
                            noteId.ToString()
                        );
                        return draftNote;
                    }
                )
            );
        }

        public async Task<NoteEntry?> ExecuteNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            NoteCommand command,
            Guid userId
        )
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    NotesModel
                >.LockedItem<NotesModel> lockedModel = await _TenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (NoteCommandExecuted Event, long SequenceNumber, NoteEntry? NoteEntry, Action OnCommit) result =
                    lockedModel.Value.ExecuteNoteCommand(command, userId, DateTime.UtcNow);

                // We do not want to commit draft note contents to the immutable event log.
                // Only approved note contents should be committed, which means that draft note contents need to
                // be stored separately. In this case, we use a key-value store and delete drafts once they are
                // no longer needed (i.e., when the draft note is either discarded or approved).
                // As a result of using multiple backends, there is a potential for partial failure, which we
                // mitigate by focusing on preserving committed or to-be-committed data; drafts are less critical.

                NoteCommandExecuted redactedEventToPersist = result.Event with
                {
                    Command = result.Event.Command switch
                    {
                        CreateDraftNote e => e with { DraftNoteContents = null },
                        EditDraftNote e => e with { DraftNoteContents = null },
                        _ => result.Event.Command,
                    },
                };
                await _EventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    redactedEventToPersist,
                    result.SequenceNumber
                );
                result.OnCommit();

                switch (result.Event.Command)
                {
                    case CreateDraftNote c:
                        await _DraftNotesStore.UpsertAsync(
                            organizationId,
                            locationId,
                            command.NoteId.ToString(),
                            c.DraftNoteContents
                        );
                        break;
                    case EditDraftNote c:
                        await _DraftNotesStore.UpsertAsync(
                            organizationId,
                            locationId,
                            command.NoteId.ToString(),
                            c.DraftNoteContents
                        );
                        break;
                    case DiscardDraftNote:
                    case ApproveNote:
                        await _DraftNotesStore.DeleteAsync(organizationId, locationId, command.NoteId.ToString());
                        break;
                }

                return result.NoteEntry;
            }
        }

        public async Task<ImmutableList<NoteEntry>> ListFamilyNotesAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        )
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    NotesModel
                >.LockedItem<NotesModel> lockedModel = await _TenantModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindNoteEntries(note => note.FamilyId == familyId);
            }
        }
    }
}
