using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using JsonPolymorph;
using Nito.AsyncEx;

namespace CareTogether.Resources.V1Referrals
{
    public record V1ReferralNoteEntry(
        Guid Id,
        Guid ReferralId,
        Guid AuthorId,
        DateTime? CreatedTimestampUtc,
        DateTime LastEditTimestampUtc,
        V1ReferralNoteStatus Status,
        string? Contents,
        Guid? ApproverId,
        DateTime? ApprovedTimestampUtc,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel
    );

    public enum V1ReferralNoteStatus
    {
        Draft,
        Approved,
    }

    [JsonHierarchyBase]
    public abstract partial record V1ReferralNoteCommand(Guid ReferralId, Guid NoteId);

    public sealed record CreateV1ReferralDraftNote(
        Guid ReferralId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record EditV1ReferralDraftNote(
        Guid ReferralId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record DiscardV1ReferralDraftNote(Guid ReferralId, Guid NoteId)
        : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record ApproveV1ReferralNote(
        Guid ReferralId,
        Guid NoteId,
        string FinalizedNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record UpdateV1ReferralNoteAccessLevel(
        Guid ReferralId,
        Guid NoteId,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    [JsonHierarchyBase]
    public abstract partial record V1ReferralNotesEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record V1ReferralNoteCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        V1ReferralNoteCommand Command
    ) : V1ReferralNotesEvent(UserId, TimestampUtc);

    public sealed class V1ReferralNotesModel
    {
        private ImmutableDictionary<Guid, V1ReferralNoteEntry> notes = ImmutableDictionary<
            Guid,
            V1ReferralNoteEntry
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<V1ReferralNotesModel> InitializeAsync(
            IAsyncEnumerable<(V1ReferralNotesEvent DomainEvent, long SequenceNumber)> eventLog,
            Func<Guid, Task<string?>> loadDraftNoteAsync
        )
        {
            var model = new V1ReferralNotesModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            model.notes = (
                await model
                    .notes.Select(async note =>
                    {
                        return (
                            note.Key,
                            note.Value with
                            {
                                Contents =
                                    note.Value.Status == V1ReferralNoteStatus.Approved
                                        ? note.Value.Contents
                                        : await loadDraftNoteAsync(note.Key),
                            }
                        );
                    })
                    .WhenAll()
            ).ToImmutableDictionary(note => note.Key, note => note.Item2);

            return model;
        }

        public (
            V1ReferralNoteCommandExecuted Event,
            long SequenceNumber,
            V1ReferralNoteEntry? NoteEntry,
            Action OnCommit
        ) ExecuteNoteCommand(V1ReferralNoteCommand command, Guid userId, DateTime timestampUtc)
        {
            if (command is CreateV1ReferralDraftNote && notes.ContainsKey(command.NoteId))
                throw new InvalidOperationException(
                    "A new note with the requested note ID could not be created because a note with that ID already exists."
                );

            var noteEntryToUpsert = command switch
            {
                CreateV1ReferralDraftNote c => new V1ReferralNoteEntry(
                    c.NoteId,
                    c.ReferralId,
                    userId,
                    CreatedTimestampUtc: timestampUtc,
                    LastEditTimestampUtc: timestampUtc,
                    V1ReferralNoteStatus.Draft,
                    c.DraftNoteContents,
                    ApproverId: null,
                    ApprovedTimestampUtc: null,
                    BackdatedTimestampUtc: c.BackdatedTimestampUtc,
                    AccessLevel: c.AccessLevel
                ),
                DiscardV1ReferralDraftNote => null,
                _ => notes.TryGetValue(command.NoteId, out var noteEntry)
                    ? command switch
                    {
                        EditV1ReferralDraftNote c => noteEntry with
                        {
                            Contents = c.DraftNoteContents,
                            LastEditTimestampUtc = timestampUtc,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                            AccessLevel = c.AccessLevel,
                        },
                        ApproveV1ReferralNote c => noteEntry with
                        {
                            Status = V1ReferralNoteStatus.Approved,
                            Contents = c.FinalizedNoteContents,
                            ApprovedTimestampUtc = timestampUtc,
                            ApproverId = userId,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                            AccessLevel = c.AccessLevel,
                        },
                        UpdateV1ReferralNoteAccessLevel c
                            when noteEntry.Status == V1ReferralNoteStatus.Approved => noteEntry with
                        {
                            AccessLevel = string.IsNullOrWhiteSpace(c.AccessLevel)
                                ? null
                                : c.AccessLevel,
                            LastEditTimestampUtc = timestampUtc,
                        },
                        UpdateV1ReferralNoteAccessLevel _ => throw new InvalidOperationException(
                            "Just approved notes can change access levels"
                        ),
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented."
                        ),
                    }
                    : throw new KeyNotFoundException(
                        "A note with the specified ID does not exist."
                    ),
            };

            return (
                Event: new V1ReferralNoteCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                NoteEntry: noteEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    notes =
                        noteEntryToUpsert == null
                            ? notes.Remove(command.NoteId)
                            : notes.SetItem(command.NoteId, noteEntryToUpsert);
                }
            );
        }

        public ImmutableList<V1ReferralNoteEntry> FindNoteEntries(
            Func<V1ReferralNoteEntry, bool> predicate
        ) => notes.Values.Where(predicate).ToImmutableList();

        private void ReplayEvent(V1ReferralNotesEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is V1ReferralNoteCommandExecuted executed)
            {
                var (_, _, _, onCommit) = ExecuteNoteCommand(
                    executed.Command,
                    executed.UserId,
                    executed.TimestampUtc
                );
                onCommit();
            }
            else
            {
                throw new NotImplementedException(
                    $"The event type '{domainEvent.GetType().FullName}' has not been implemented."
                );
            }

            LastKnownSequenceNumber = sequenceNumber;
        }
    }

    public interface IV1ReferralNotesResource
    {
        Task<ImmutableList<V1ReferralNoteEntry>> ListReferralNotesAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        );

        Task<V1ReferralNoteEntry?> ExecuteReferralNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralNoteCommand command,
            Guid userId
        );
    }
}
