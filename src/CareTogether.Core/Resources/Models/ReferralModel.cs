using CareTogether.Managers;
using JsonPolymorph;
using OneOf;
using OneOf.Types;
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

    public record ReferralEntry(Guid Id, string PolicyVersion, DateTime TimestampUtc,
        ReferralCloseReason? CloseReason,
        Guid PartneringFamilyId,
        ImmutableList<FormUploadInfo> ReferralFormUploads,
        ImmutableList<ActivityInfo> ReferralActivitiesPerformed,
        ImmutableDictionary<Guid, ArrangementEntry> Arrangements);

    public record ArrangementEntry(Guid Id, string PolicyVersion, string ArrangementType,
        ArrangementState State,
        ImmutableList<FormUploadInfo> ArrangementFormUploads,
        ImmutableList<ActivityInfo> ArrangementActivitiesPerformed,
        ImmutableList<VolunteerAssignment> VolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildrenLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableDictionary<Guid, NoteEntry> Notes);

    public record NoteEntry(Guid Id, Guid AuthorId, DateTime LastEditTimestampUtc, NoteStatus Status,
        string FinalizedNoteContents, Guid? ApproverId, DateTime? ApprovedTimestampUtc);

    public sealed class ReferralModel
    {
        private ImmutableDictionary<Guid, ReferralEntry> referrals = ImmutableDictionary<Guid, ReferralEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<ReferralModel> InitializeAsync(
            IAsyncEnumerable<(ReferralEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new ReferralModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public OneOf<Success<(ReferralCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>, Error<string>>
            ExecuteReferralCommand(ReferralCommand command, Guid userId, DateTime timestampUtc)
        {
            OneOf<ReferralEntry, Error<string>> result = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateReferral c => new ReferralEntry(c.ReferralId, c.PolicyVersion, timestampUtc, null, c.FamilyId,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableDictionary<Guid, ArrangementEntry>.Empty),
                _ => referrals.TryGetValue(command.ReferralId, out var referralEntry)
                    ? command switch
                    {
                        //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                        //      This involves returning "allowed actions" with the rendered Referral state
                        //      and failing any attempted actions that are not allowed.
                        PerformReferralActivity c => referralEntry with
                        {
                            ReferralActivitiesPerformed = referralEntry.ReferralActivitiesPerformed.Add(
                                new ActivityInfo(userId, timestampUtc, c.ActivityName))
                        },
                        UploadReferralForm c => referralEntry with
                        {
                            ReferralFormUploads = referralEntry.ReferralFormUploads.Add(
                                new FormUploadInfo(userId, timestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
                        },
                        CloseReferral c => referralEntry with
                        {
                            CloseReason = c.CloseReason
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("A family with the specified ID does not exist.")
            };
            if (result.TryPickT0(out var referralEntryToUpsert, out var error))
            {
                return new Success<(ReferralCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>((
                    Event: new ReferralCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    ReferralEntry: referralEntryToUpsert,
                    OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
            }
            else
                return result.AsT1;
        }

        public OneOf<Success<(ArrangementCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>, Error<string>>
            ExecuteArrangementCommand(ArrangementCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                return new Error<string>("A referral with the specified ID does not exist.");

            OneOf<ArrangementEntry, Error<string>> result = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateArrangement c => new ArrangementEntry(c.ArrangementId, c.PolicyVersion, c.ArrangementType, ArrangementState.Setup,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableList<VolunteerAssignment>.Empty,
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
                            VolunteerAssignments = arrangementEntry.VolunteerAssignments.Add(
                                new IndividualVolunteerAssignment(c.PersonId, c.ArrangementFunction))
                        },
                        AssignVolunteerFamily c => arrangementEntry with
                        {
                            VolunteerAssignments = arrangementEntry.VolunteerAssignments.Add(
                                new FamilyVolunteerAssignment(c.FamilyId, c.ArrangementFunction))
                        },
                        AssignPartneringFamilyChildren c => arrangementEntry with
                        {
                            PartneringFamilyChildAssignments = arrangementEntry.PartneringFamilyChildAssignments.AddRange(
                                c.ChildrenIds.Select(c => new PartneringFamilyChildAssignment(c)))
                        },
                        InitiateArrangement c => arrangementEntry with
                        {
                            State = ArrangementState.Open
                        },
                        UploadArrangementForm c => arrangementEntry with
                        {
                            ArrangementFormUploads = arrangementEntry.ArrangementFormUploads.Add(
                                new FormUploadInfo(userId, timestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
                        },
                        PerformArrangementActivity c => arrangementEntry with
                        {
                            ArrangementActivitiesPerformed = arrangementEntry.ArrangementActivitiesPerformed.Add(
                                new ActivityInfo(userId, timestampUtc, c.ActivityName))
                        },
                        TrackChildrenLocationChange c => arrangementEntry with
                        {
                            ChildrenLocationHistory = arrangementEntry.ChildrenLocationHistory.Add(
                                new ChildrenLocationHistoryEntry(userId, c.ChangedAtUtc,
                                    c.ChildrenIds, c.FamilyId, c.Plan, c.AdditionalExplanation))
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("An arrangement with the specified ID does not exist.")
            };

            if (result.TryPickT0(out var arrangementEntryToUpsert, out var error))
            {
                var referralEntryToUpsert = referralEntry with
                {
                    Arrangements = referralEntry.Arrangements.SetItem(command.ArrangementId, arrangementEntryToUpsert)
                };
                return new Success<(ArrangementCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>((
                    Event: new ArrangementCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    ReferralEntry: referralEntryToUpsert,
                    OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
            }
            else
                return error;
        }

        public OneOf<Success<(ArrangementNoteCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>, Error<string>>
            ExecuteArrangementNoteCommand(ArrangementNoteCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                return new Error<string>("A referral with the specified ID does not exist.");

            if (!referralEntry.Arrangements.TryGetValue(command.ArrangementId, out var arrangementEntry))
                return new Error<string>("An arrangement with the specified ID does not exist.");

            OneOf<NoteEntry, Error<string>> result = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateDraftArrangementNote c => new NoteEntry(c.NoteId, userId, timestampUtc, NoteStatus.Draft, null, null, null),
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
                            LastEditTimestampUtc = timestampUtc
                        },
                        ApproveArrangementNote c => noteEntry with
                        {
                            Status = NoteStatus.Approved,
                            FinalizedNoteContents = c.FinalizedNoteContents,
                            ApprovedTimestampUtc = timestampUtc,
                            ApproverId = userId
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("An arrangement with the specified ID does not exist.")
            };

            if (result.TryPickT0(out var noteEntryToUpsert, out var error))
            {
                var referralEntryToUpsert = referralEntry with
                {
                    Arrangements = referralEntry.Arrangements.SetItem(command.ArrangementId, arrangementEntry with
                    {
                        Notes = noteEntryToUpsert == null
                            ? arrangementEntry.Notes.Remove(command.NoteId)
                            : arrangementEntry.Notes.SetItem(command.NoteId, noteEntryToUpsert)
                    })
                };
                return new Success<(ArrangementNoteCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>((
                    Event: new ArrangementNoteCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    ReferralEntry: referralEntryToUpsert,
                    OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
                    //TODO: Implement -- requires coordination with underlying resource service via emitting IFormsResource commands
                    //      (which are not executed by the ReferralModel but by its caller, the ReferralManager, in non-replay scenarios).
            }
            else
                return error;
        }

        public IImmutableList<ReferralEntry> FindReferralEntries(Func<ReferralEntry, bool> predicate)
        {
            return referrals.Values
                .Where(predicate)
                .ToImmutableList();
        }

        public ResourceResult<ReferralEntry> GetReferralEntry(Guid referralId) =>
            referrals.TryGetValue(referralId, out var referralEntry)
            ? referralEntry
            : ResourceResult.NotFound;


        private void ReplayEvent(ReferralEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is ReferralCommandExecuted referralCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteReferralCommand(referralCommandExecuted.Command,
                    referralCommandExecuted.UserId, referralCommandExecuted.TimestampUtc).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is ArrangementCommandExecuted arrangementCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementCommand(arrangementCommandExecuted.Command,
                    arrangementCommandExecuted.UserId, arrangementCommandExecuted.TimestampUtc).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is ArrangementNoteCommandExecuted arrangementNoteCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementNoteCommand(arrangementNoteCommandExecuted.Command,
                    arrangementNoteCommandExecuted.UserId, arrangementNoteCommandExecuted.TimestampUtc).AsT0.Value;
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
