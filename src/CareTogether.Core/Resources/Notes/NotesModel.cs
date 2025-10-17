using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using JsonPolymorph;
using Nito.AsyncEx;

namespace CareTogether.Resources.Notes
{
    [JsonHierarchyBase]
    public abstract partial record NotesEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record NoteCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        NoteCommand Command
    ) : NotesEvent(UserId, TimestampUtc);

    public sealed class NotesModel
    {
        private ImmutableDictionary<Guid, NoteEntry> notes = ImmutableDictionary<
            Guid,
            NoteEntry
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<NotesModel> InitializeAsync(
            IAsyncEnumerable<(NotesEvent DomainEvent, long SequenceNumber)> eventLog,
            Func<Guid, Task<string?>> loadDraftNoteAsync
        )
        {
            var model = new NotesModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            // Since draft note contents are not stored in the immutable log, note command replays will result in 'null'
            // contents for any notes that have not been approved (approved note contents are stored in the log). So, we
            // need to load the contents for any draft notes.
            model.notes = (
                await model
                    .notes.Select(async note =>
                    {
                        return (
                            note.Key,
                            note.Value with
                            {
                                Contents =
                                    note.Value.Status == NoteStatus.Approved
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
            NoteCommandExecuted Event,
            long SequenceNumber,
            NoteEntry? NoteEntry,
            Action OnCommit
        ) ExecuteNoteCommand(NoteCommand command, Guid userId, DateTime timestampUtc)
        {
            if (command is CreateDraftNote && notes.ContainsKey(command.NoteId))
                throw new InvalidOperationException(
                    "A new note with the requested note ID could not be created because a note with that ID already exists."
                );

            var noteEntryToUpsert = command switch
            {
                CreateDraftNote c => new NoteEntry(
                    c.NoteId,
                    c.FamilyId,
                    userId,
                    CreatedTimestampUtc: timestampUtc,
                    LastEditTimestampUtc: timestampUtc,
                    TimestampUtc: timestampUtc,
                    NoteStatus.Draft,
                    c.DraftNoteContents,
                    ApproverId: null,
                    ApprovedTimestampUtc: null,
                    BackdatedTimestampUtc: c.BackdatedTimestampUtc,
                    AccessLevel: c.AccessLevel
                ),
                DiscardDraftNote c => null,
                _ => notes.TryGetValue(command.NoteId, out var noteEntry)
                    ? command switch
                    {
                        //TODO: Invariants need to be enforced in the model - e.g., no edits or deletes to approved notes.
                        EditDraftNote c => noteEntry with
                        {
                            Contents = c.DraftNoteContents,
                            LastEditTimestampUtc = timestampUtc,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                            AccessLevel = c.AccessLevel,
                        },
                        ApproveNote c => noteEntry with
                        {
                            Status = NoteStatus.Approved,
                            Contents = c.FinalizedNoteContents,
                            ApprovedTimestampUtc = timestampUtc,
                            ApproverId = userId,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                            AccessLevel = c.AccessLevel,
                        },
                        UpdateNoteAccessLevel c when noteEntry.Status == NoteStatus.Approved =>
                            noteEntry with
                            {
                                AccessLevel = string.IsNullOrWhiteSpace(c.AccessLevel)
                                    ? null
                                    : c.AccessLevel,
                                LastEditTimestampUtc = timestampUtc,
                            },
                        UpdateNoteAccessLevel _ => throw new InvalidOperationException(
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
                Event: new NoteCommandExecuted(userId, timestampUtc, command),
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

        public ImmutableList<NoteEntry> FindNoteEntries(Func<NoteEntry, bool> predicate)
        {
            return notes.Values.Where(predicate).ToImmutableList();
        }

        public NoteEntry GetNoteEntry(Guid noteId) => notes[noteId];

        private void ReplayEvent(NotesEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is NoteCommandExecuted noteCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteNoteCommand(
                    noteCommandExecuted.Command,
                    noteCommandExecuted.UserId,
                    noteCommandExecuted.TimestampUtc
                );
                onCommit();
            }
            else
                throw new NotImplementedException(
                    $"The event type '{domainEvent.GetType().FullName}' has not been implemented."
                );

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
