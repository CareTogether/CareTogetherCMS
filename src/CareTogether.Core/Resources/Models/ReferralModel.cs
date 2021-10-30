using JsonPolymorph;
using Nito.AsyncEx;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Models
{
    [JsonHierarchyBase]
    public abstract partial record ReferralEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record ReferralCommandExecuted(Guid UserId, DateTime TimestampUtc,
        ReferralCommand Command) : ReferralEvent(UserId, TimestampUtc);
    public sealed record ArrangementCommandExecuted(Guid UserId, DateTime TimestampUtc,
        ArrangementCommand Command) : ReferralEvent(UserId, TimestampUtc);
    public sealed record ArrangementNoteCommandExecuted(Guid UserId, DateTime TimestampUtc,
        ArrangementNoteCommand Command) : ReferralEvent(UserId, TimestampUtc);

    public sealed class ReferralModel
    {
        private ImmutableDictionary<Guid, ReferralEntry> referrals = ImmutableDictionary<Guid, ReferralEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<ReferralModel> InitializeAsync(
            IAsyncEnumerable<(ReferralEvent DomainEvent, long SequenceNumber)> eventLog,
            Func<Guid, Task<string?>> loadDraftNoteAsync)
        {
            var model = new ReferralModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            // Since draft note contents are not stored in the immutable log, note command replays will result in 'null'
            // contents for any notes that have not been approved (approved note contents are stored in the log). So, we
            // need to load the contents for any draft notes.
            model.referrals = (await model.referrals.Select(async referral =>
            {
                return (referral.Key, referral.Value with
                {
                    Arrangements = (await referral.Value.Arrangements.Select(async arrangement =>
                    {
                        return (arrangement.Key, arrangement.Value with
                        {
                            Notes = (await arrangement.Value.Notes.Select(async note =>
                            {
                                return (note.Key, note.Value with
                                {
                                    Contents = note.Value.Status == NoteStatus.Approved
                                        ? note.Value.Contents
                                        : await loadDraftNoteAsync(note.Key)
                                });
                            }).WhenAll()).ToImmutableDictionary(note => note.Key, note => note.Item2)
                        });
                    }).WhenAll()).ToImmutableDictionary(arrangement => arrangement.Key, arrangement => arrangement.Item2)
                });
            }).WhenAll()).ToImmutableDictionary(referral => referral.Key, referral => referral.Item2);

            return model;
        }


        public (ReferralCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)
            ExecuteReferralCommand(ReferralCommand command, Guid userId, DateTime timestampUtc)
        {
            var referralEntryToUpsert = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateReferral c => new ReferralEntry(c.ReferralId, c.FamilyId,
                    c.OpenedAtUtc, CloseReason: null,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableDictionary<Guid, ArrangementEntry>.Empty),
                _ => referrals.TryGetValue(command.ReferralId, out var referralEntry)
                    ? command switch
                    {
                        //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                        //      This involves returning "allowed actions" with the rendered Referral state
                        //      and failing any attempted actions that are not allowed.
                        CompleteReferralRequirement c => referralEntry with
                        {
                            CompletedRequirements = referralEntry.CompletedRequirements.Add(
                                new CompletedRequirementInfo(userId, timestampUtc, c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                        },
                        UploadReferralDocument c => referralEntry with
                        {
                            UploadedDocuments = referralEntry.UploadedDocuments.Add(
                                new UploadedDocumentInfo(userId, timestampUtc, c.UploadedDocumentId, c.UploadedFileName))
                        },
                        CloseReferral c => referralEntry with
                        {
                            CloseReason = c.CloseReason
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("A family with the specified ID does not exist.")
            };

            return (
                Event: new ReferralCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                ReferralEntry: referralEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert);
                });
        }

        public (ArrangementCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)
            ExecuteArrangementCommand(ArrangementCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                throw new KeyNotFoundException("A referral with the specified ID does not exist.");

            var arrangementEntryToUpsert = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateArrangement c => new ArrangementEntry(c.ArrangementId, c.ArrangementType,
                    ArrangementState.Setup, InitiatedAtUtc: null, EndedAtUtc: null,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<IndividualVolunteerAssignment>.Empty, ImmutableList<FamilyVolunteerAssignment>.Empty,
                    ImmutableList<PartneringFamilyChildAssignment>.Empty, ImmutableList<ChildrenLocationHistoryEntry>.Empty,
                    ImmutableDictionary<Guid, NoteEntry>.Empty),
                _ => referralEntry.Arrangements.TryGetValue(command.ArrangementId, out var arrangementEntry)
                    ? command switch
                    {
                        //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                        //      This involves returning "allowed actions" with the rendered Referral state
                        //      and failing any attempted actions that are not allowed.
                        AssignIndividualVolunteer c => arrangementEntry with
                        {
                            IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.Add(
                                new IndividualVolunteerAssignment(c.VolunteerFamilyId, c.AdultId, c.ArrangementFunction))
                        },
                        AssignVolunteerFamily c => arrangementEntry with
                        {
                            FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.Add(
                                new FamilyVolunteerAssignment(c.VolunteerFamilyId, c.ArrangementFunction))
                        },
                        AssignPartneringFamilyChildren c => arrangementEntry with
                        {
                            PartneringFamilyChildAssignments = arrangementEntry.PartneringFamilyChildAssignments.AddRange(
                                c.ChildrenIds.Select(c => new PartneringFamilyChildAssignment(c)))
                        },
                        StartArrangement c => arrangementEntry with
                        {
                            State = ArrangementState.Open,
                            InitiatedAtUtc = c.StartedAtUtc
                        },
                        CompleteArrangementRequirement c => arrangementEntry with
                        {
                            CompletedRequirements = arrangementEntry.CompletedRequirements.Add(
                                new CompletedRequirementInfo(userId, timestampUtc, c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                        },
                        UploadArrangementDocument c => arrangementEntry with
                        {
                            UploadedDocuments = arrangementEntry.UploadedDocuments.Add(
                                new UploadedDocumentInfo(userId, timestampUtc, c.UploadedDocumentId, c.UploadedFileName))
                        },
                        TrackChildLocationChange c => arrangementEntry with
                        {
                            ChildrenLocationHistory = arrangementEntry.ChildrenLocationHistory.Add(
                                new ChildrenLocationHistoryEntry(userId, c.ChangedAtUtc,
                                    c.ChildId, c.ChildLocationFamilyId, c.Plan, c.AdditionalExplanation))
                        },
                        EndArrangement c => arrangementEntry with
                        {
                            State = ArrangementState.Closed,
                            EndedAtUtc = c.EndedAtUtc
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("An arrangement with the specified ID does not exist.")
            };

            var referralEntryToUpsert = referralEntry with
            {
                Arrangements = referralEntry.Arrangements.SetItem(command.ArrangementId, arrangementEntryToUpsert)
            };
            return (
                Event: new ArrangementCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                ReferralEntry: referralEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert);
                });
        }

        public (ArrangementNoteCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)
            ExecuteArrangementNoteCommand(ArrangementNoteCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                throw new KeyNotFoundException("A referral with the specified ID does not exist.");

            if (!referralEntry.Arrangements.TryGetValue(command.ArrangementId, out var arrangementEntry))
                throw new KeyNotFoundException("An arrangement with the specified ID does not exist.");

            var noteEntryToUpsert = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateDraftArrangementNote c => new NoteEntry(c.NoteId, userId, timestampUtc, NoteStatus.Draft,
                    c.DraftNoteContents, ApproverId: null, ApprovedTimestampUtc: null),
                DiscardDraftArrangementNote c => null,
                _ => arrangementEntry.Notes.TryGetValue(command.NoteId, out var noteEntry)
                    ? command switch
                    {
                        //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                        //      This involves returning "allowed actions" with the rendered Referral state
                        //      and failing any attempted actions that are not allowed.
                        //TODO: Invariants need to be enforced in the model - e.g., no edits or deletes to approved notes.
                        EditDraftArrangementNote c => noteEntry with
                        {
                            Contents = c.DraftNoteContents,
                            LastEditTimestampUtc = timestampUtc
                        },
                        ApproveArrangementNote c => noteEntry with
                        {
                            Status = NoteStatus.Approved,
                            Contents = c.FinalizedNoteContents,
                            ApprovedTimestampUtc = timestampUtc,
                            ApproverId = userId
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("An arrangement with the specified ID does not exist.")
            };

            var referralEntryToUpsert = referralEntry with
            {
                Arrangements = referralEntry.Arrangements.SetItem(command.ArrangementId, arrangementEntry with
                {
                    Notes = noteEntryToUpsert == null
                        ? arrangementEntry.Notes.Remove(command.NoteId)
                        : arrangementEntry.Notes.SetItem(command.NoteId, noteEntryToUpsert)
                })
            };
            return (
                Event: new ArrangementNoteCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                ReferralEntry: referralEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert);
                });
                //TODO: Implement -- requires coordination with underlying resource service via emitting IFormsResource commands
                //      (which are not executed by the ReferralModel but by its caller, the ReferralManager, in non-replay scenarios).
        }

        public ImmutableList<ReferralEntry> FindReferralEntries(Func<ReferralEntry, bool> predicate)
        {
            return referrals.Values
                .Where(predicate)
                .ToImmutableList();
        }

        public ReferralEntry GetReferralEntry(Guid referralId) => referrals[referralId];


        private void ReplayEvent(ReferralEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is ReferralCommandExecuted referralCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteReferralCommand(referralCommandExecuted.Command,
                    referralCommandExecuted.UserId, referralCommandExecuted.TimestampUtc);
                onCommit();
            }
            else if (domainEvent is ArrangementCommandExecuted arrangementCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementCommand(arrangementCommandExecuted.Command,
                    arrangementCommandExecuted.UserId, arrangementCommandExecuted.TimestampUtc);
                onCommit();
            }
            else if (domainEvent is ArrangementNoteCommandExecuted arrangementNoteCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementNoteCommand(arrangementNoteCommandExecuted.Command,
                    arrangementNoteCommandExecuted.UserId, arrangementNoteCommandExecuted.TimestampUtc);
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
