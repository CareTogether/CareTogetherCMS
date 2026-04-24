using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Resources.V1Referrals
{
    public sealed class V1ReferralsResource
        : IV1ReferralsResource,
            IV1ReferralDocumentsResource,
            IV1ReferralNotesResource
    {
        private readonly IEventLog<V1ReferralEvent> eventLog;
        private readonly IEventLog<V1ReferralNotesEvent> notesEventLog;
        private readonly IObjectStore<string?> draftNotesStore;
        private readonly IFileStore fileStore;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1ReferralModel
        > tenantModels;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            V1ReferralNotesModel
        > tenantNotesModels;

        public V1ReferralsResource(
            IEventLog<V1ReferralEvent> eventLog,
            IEventLog<V1ReferralNotesEvent> notesEventLog,
            IObjectStore<string?> draftNotesStore,
            IFileStore fileStore
        )
        {
            this.eventLog = eventLog;
            this.notesEventLog = notesEventLog;
            this.draftNotesStore = draftNotesStore;
            this.fileStore = fileStore;
            tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1ReferralModel
            >(key =>
                V1ReferralModel.InitializeAsync(
                    eventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
            tenantNotesModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                V1ReferralNotesModel
            >(key =>
                V1ReferralNotesModel.InitializeAsync(
                    notesEventLog.GetAllEventsAsync(key.organizationId, key.locationId),
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

        public async Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        )
        {
            using (
                var lockedModel = await tenantModels.WriteLockItemAsync((organizationId, locationId))
            )
            {
                var result = lockedModel.Value.ExecuteReferralCommand(
                    command,
                    actorUserId,
                    DateTime.UtcNow
                );

                await eventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
            }
        }

        public async Task<V1Referral?> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.GetReferral(referralId);
            }
        }

        public async Task<ImmutableList<V1Referral>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantModels.ReadLockItemAsync((organizationId, locationId))
            )
            {
                return lockedModel.Value.FindReferrals(_ => true);
            }
        }

        public async Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var referral = await GetReferralAsync(organizationId, locationId, referralId);

            if (
                referral == null
                || !referral.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
                || referral.DeletedDocuments.Any(doc => doc == documentId)
            )
                throw new Exception("The specified referral document does not exist.");

            return await fileStore.GetValetReadUrlAsync(organizationId, locationId, documentId);
        }

        public async Task<Uri> GetV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        )
        {
            var referral = await GetReferralAsync(organizationId, locationId, referralId);

            if (referral == null)
                throw new Exception("The specified referral does not exist.");

            if (referral.Status == V1ReferralStatus.Closed)
                throw new Exception("Closed referrals cannot be edited.");

            if (referral.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId))
                throw new Exception("The specified referral document already exists.");

            return await fileStore.GetValetCreateUrlAsync(organizationId, locationId, documentId);
        }

        public async Task<V1ReferralNoteEntry?> ExecuteReferralNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralNoteCommand command,
            Guid userId
        )
        {
            using (
                var lockedModel = await tenantNotesModels.WriteLockItemAsync(
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

                await notesEventLog.AppendEventAsync(
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
                var lockedModel = await tenantNotesModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindNoteEntries(note => note.ReferralId == referralId);
            }
        }
    }
}
