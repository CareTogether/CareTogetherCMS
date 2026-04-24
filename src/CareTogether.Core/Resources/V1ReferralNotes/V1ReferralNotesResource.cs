using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Resources.V1ReferralNotes
{
    public sealed class V1ReferralNotesResource : IV1ReferralNotesResource
    {
        private readonly IEventLog<V1ReferralNotesEvent> eventLog;
        private readonly IObjectStore<string?> draftNotesStore;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1ReferralNotesModel
        > tenantModels;

        public V1ReferralNotesResource(
            IEventLog<V1ReferralNotesEvent> eventLog,
            IObjectStore<string?> draftNotesStore
        )
        {
            this.eventLog = eventLog;
            this.draftNotesStore = draftNotesStore;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1ReferralNotesModel
            >(key =>
                V1ReferralNotesModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId),
                    async noteId =>
                    {
                        var draftNote = await draftNotesStore.GetAsync(
                            key.organizationId,
                            key.locationId,
                            noteId.ToString()
                        );
                        return draftNote;
                    }
                )
            );
        }

        public async Task<V1ReferralNoteEntry?> ExecuteReferralNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralNoteCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteNoteCommand(command, userId, DateTime.UtcNow);

                var redactedEventToPersist = result.Event with
                {
                    Command = result.Event.Command switch
                    {
                        CreateV1ReferralDraftNote e => e with { DraftNoteContents = null },
                        EditV1ReferralDraftNote e => e with { DraftNoteContents = null },
                        _ => result.Event.Command,
                    },
                };

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    redactedEventToPersist,
                    result.SequenceNumber
                );

                result.OnCommit();

                switch (result.Event.Command)
                {
                    case CreateV1ReferralDraftNote c:
                        await draftNotesStore.UpsertAsync(
                            organizationId,
                            locationId,
                            command.NoteId.ToString(),
                            c.DraftNoteContents
                        );
                        break;

                    case EditV1ReferralDraftNote c:
                        await draftNotesStore.UpsertAsync(
                            organizationId,
                            locationId,
                            command.NoteId.ToString(),
                            c.DraftNoteContents
                        );
                        break;

                    case DiscardV1ReferralDraftNote:
                    case ApproveV1ReferralNote:
                        await draftNotesStore.DeleteAsync(
                            organizationId,
                            locationId,
                            command.NoteId.ToString()
                        );
                        break;
                }

                return result.NoteEntry;
            }
        }

        public async Task<ImmutableList<V1ReferralNoteEntry>> ListReferralNotesAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindNoteEntries(note => note.ReferralId == referralId);
            }
        }
    }
}
