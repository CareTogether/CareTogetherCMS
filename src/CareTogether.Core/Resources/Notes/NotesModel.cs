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
    public abstract partial record NotesEvent(Guid UserId, DateTime TimestampUtc) : DomainEvent(UserId, TimestampUtc);

    public sealed record NoteCommandExecuted(Guid UserId, DateTime TimestampUtc, NoteCommand Command)
        : NotesEvent(UserId, TimestampUtc);

    public sealed class NotesModel
    {
        ImmutableDictionary<Guid, NoteEntry> _Notes = ImmutableDictionary<Guid, NoteEntry>.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<NotesModel> InitializeAsync(
            IAsyncEnumerable<(NotesEvent DomainEvent, long SequenceNumber)> eventLog,
            Func<Guid, Task<string?>> loadDraftNoteAsync
        )
        {
            NotesModel model = new();

            await foreach ((NotesEvent domainEvent, long sequenceNumber) in eventLog)
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            // Since draft note contents are not stored in the immutable log, note command replays will result in 'null'
            // contents for any notes that have not been approved (approved note contents are stored in the log). So, we
            // need to load the contents for any draft notes.

            model._Notes = (
                await model
                    ._Notes.Select(async note =>
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
            if (command is CreateDraftNote && _Notes.ContainsKey(command.NoteId))
            {
                throw new InvalidOperationException(
                    "A new note with the requested note ID could not be created because a note with that ID already exists."
                );
            }

            NoteEntry? noteEntryToUpsert = command switch
            {
                CreateDraftNote c => new NoteEntry(
                    c.NoteId,
                    c.FamilyId,
                    userId,
                    timestampUtc,
                    NoteStatus.Draft,
                    c.DraftNoteContents,
                    null,
                    null,
                    c.BackdatedTimestampUtc
                ),
                DiscardDraftNote c => null,
                _ => _Notes.TryGetValue(command.NoteId, out NoteEntry? noteEntry)
                    ? command switch
                    {
                        //TODO: Invariants need to be enforced in the model - e.g., no edits or deletes to approved notes.
                        EditDraftNote c => noteEntry with
                        {
                            Contents = c.DraftNoteContents,
                            LastEditTimestampUtc = timestampUtc,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                        },
                        ApproveNote c => noteEntry with
                        {
                            Status = NoteStatus.Approved,
                            Contents = c.FinalizedNoteContents,
                            ApprovedTimestampUtc = timestampUtc,
                            ApproverId = userId,
                            BackdatedTimestampUtc = c.BackdatedTimestampUtc,
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented."
                        ),
                    }
                    : throw new KeyNotFoundException("A note with the specified ID does not exist."),
            };

            return (
                Event: new NoteCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                NoteEntry: noteEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    _Notes =
                        noteEntryToUpsert == null
                            ? _Notes.Remove(command.NoteId)
                            : _Notes.SetItem(command.NoteId, noteEntryToUpsert);
                }
            );
        }

        public ImmutableList<NoteEntry> FindNoteEntries(Func<NoteEntry, bool> predicate)
        {
            return _Notes.Values.Where(predicate).ToImmutableList();
        }

        public NoteEntry GetNoteEntry(Guid noteId)
        {
            return _Notes[noteId];
        }

        void ReplayEvent(NotesEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is NoteCommandExecuted noteCommandExecuted)
            {
                (NoteCommandExecuted _, long _, NoteEntry _, Action onCommit) = ExecuteNoteCommand(
                    noteCommandExecuted.Command,
                    noteCommandExecuted.UserId,
                    noteCommandExecuted.TimestampUtc
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
}
