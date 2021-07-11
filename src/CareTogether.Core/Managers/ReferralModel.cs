using CareTogether.Resources;
using JsonPolymorph;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    [JsonHierarchyBase]
    public abstract partial record ReferralEvent();
    public sealed record ReferralCommandExecuted(ReferralCommand Command) : ReferralEvent;
    public sealed record ArrangementCommandExecuted(ArrangementCommand Command) : ReferralEvent;
    public sealed record ArrangementNoteCommandExecuted(ArrangementNoteCommand Command) : ReferralEvent;

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
        ImmutableList<Guid> DraftNotes, ImmutableList<Guid> ApprovedNotes);

    public sealed class ReferralModel
    {
        //TODO: Implement thread safety using a reader writer lock (slim)?

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
            ExecuteReferralCommand(ReferralCommand command)
        {
            OneOf<ReferralEntry, Error<string>> result = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateReferral c => new ReferralEntry(c.ReferralId, c.PolicyVersion, c.TimestampUtc, null, c.FamilyId,
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
                                new ActivityInfo(c.UserId, c.TimestampUtc, c.ActivityName))
                        },
                        UploadReferralForm c => referralEntry with
                        {
                            ReferralFormUploads = referralEntry.ReferralFormUploads.Add(
                                new FormUploadInfo(c.UserId, c.TimestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
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
                    Event: new ReferralCommandExecuted(command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    ReferralEntry: referralEntryToUpsert,
                    OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
            }
            else
                return result.AsT1;
        }

        public OneOf<Success<(ArrangementCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>, Error<string>>
            ExecuteArrangementCommand(ArrangementCommand command)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                return new Error<string>("A referral with the specified ID does not exist.");

            OneOf<ArrangementEntry, Error<string>> result = command switch
            {
                //TODO: Validate policy version and enforce any other invariants
                CreateArrangement c => new ArrangementEntry(c.ArrangementId, c.PolicyVersion, c.ArrangementType, ArrangementState.Setup,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableList<VolunteerAssignment>.Empty,
                    ImmutableList<PartneringFamilyChildAssignment>.Empty, ImmutableList<ChildrenLocationHistoryEntry>.Empty,
                    ImmutableList<Guid>.Empty, ImmutableList<Guid>.Empty),
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
                                new FormUploadInfo(c.UserId, c.TimestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
                        },
                        PerformArrangementActivity c => arrangementEntry with
                        {
                            ArrangementActivitiesPerformed = arrangementEntry.ArrangementActivitiesPerformed.Add(
                                new ActivityInfo(c.UserId, c.TimestampUtc, c.ActivityName))
                        },
                        TrackChildrenLocationChange c => arrangementEntry with
                        {
                            ChildrenLocationHistory = arrangementEntry.ChildrenLocationHistory.Add(
                                new ChildrenLocationHistoryEntry(c.UserId, c.TimestampUtc,
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
                    Event: new ArrangementCommandExecuted(command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    ReferralEntry: referralEntryToUpsert,
                    OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
            }
            else
                return error;
        }

        public OneOf<Success<(ArrangementNoteCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)>, Error<string>>
            ExecuteArrangementNoteCommand(ArrangementNoteCommand command)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                return new Error<string>("A referral with the specified ID does not exist.");

            //OneOf<ArrangementEntry, Error<string>> result = command switch
            //{
            //    //TODO: Validate policy version and enforce any other invariants
            //    CreateArrangement c => new ArrangementEntry(c.ArrangementId, c.PolicyVersion, c.ArrangementType, ArrangementState.Setup,
            //        ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableList<VolunteerAssignment>.Empty,
            //        ImmutableList<PartneringFamilyChildAssignment>.Empty, ImmutableList<ChildrenLocationHistoryEntry>.Empty,
            //        ImmutableList<Guid>.Empty, ImmutableList<Guid>.Empty),
            //    _ => referralEntry.Arrangements.TryGetValue(command.ArrangementId, out var arrangementEntry)
            //        ? command switch
            //        {
            //            //TODO: Enforce any business rules dynamically via the policy evaluation engine.
            //            //      This involves returning "allowed actions" with the rendered Referral state
            //            //      and failing any attempted actions that are not allowed.
            //            AssignIndividualVolunteer c => arrangementEntry with
            //            {
            //                VolunteerAssignments = arrangementEntry.VolunteerAssignments.Add(
            //                    new IndividualVolunteerAssignment(c.PersonId, c.ArrangementFunction))
            //            },
            //            AssignVolunteerFamily c => arrangementEntry with
            //            {
            //                VolunteerAssignments = arrangementEntry.VolunteerAssignments.Add(
            //                    new FamilyVolunteerAssignment(c.FamilyId, c.ArrangementFunction))
            //            },
            //            AssignPartneringFamilyChildren c => arrangementEntry with
            //            {
            //                PartneringFamilyChildAssignments = arrangementEntry.PartneringFamilyChildAssignments.AddRange(
            //                    c.ChildrenIds.Select(c => new PartneringFamilyChildAssignment(c)))
            //            },
            //            InitiateArrangement c => arrangementEntry with
            //            {
            //                State = ArrangementState.Open
            //            },
            //            UploadArrangementForm c => arrangementEntry with
            //            {
            //                ArrangementFormUploads = arrangementEntry.ArrangementFormUploads.Add(
            //                    new FormUploadInfo(c.UserId, c.TimestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
            //            },
            //            PerformArrangementActivity c => arrangementEntry with
            //            {
            //                ArrangementActivitiesPerformed = arrangementEntry.ArrangementActivitiesPerformed.Add(
            //                    new ActivityInfo(c.UserId, c.TimestampUtc, c.ActivityName))
            //            },
            //            TrackChildrenLocationChange c => arrangementEntry with
            //            {
            //                ChildrenLocationHistory = arrangementEntry.ChildrenLocationHistory.Add(
            //                    new ChildrenLocationHistoryEntry(c.UserId, c.TimestampUtc,
            //                        c.ChildrenIds, c.FamilyId, c.Plan, c.AdditionalExplanation))
            //            },
            //            _ => throw new NotImplementedException(
            //                $"The command type '{command.GetType().FullName}' has not been implemented.")
            //        }
            //        : new Error<string>("An arrangement with the specified ID does not exist.")
            //};

            //if (result.TryPickT0(out var arrangementEntryToUpsert, out var error))
            //{
            //    var referralEntryToUpsert = referralEntry with
            //    {
            //        Arrangements = referralEntry.Arrangements.SetItem(command.ArrangementId, arrangementEntryToUpsert)
            //    };
            //    var families = await getFamiliesAsync();
            //    var contacts = await getContactsAsync();
            //    return new Success<(ArrangementCommandExecuted Event, long SequenceNumber, Referral Referral, Action OnCommit)>((
            //        Event: new ArrangementCommandExecuted(command),
            //        SequenceNumber: LastKnownSequenceNumber + 1,
            //        Referral: referralEntryToUpsert.ToReferral(families, contacts),
            //        OnCommit: () => referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert)));
            //}
            //else
            //    return error;
            throw new NotImplementedException();
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
                var (_, _, _, onCommit) = (ExecuteReferralCommand(referralCommandExecuted.Command)).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is ArrangementCommandExecuted arrangementCommandExecuted)
            {
                var (_, _, _, onCommit) = (ExecuteArrangementCommand(arrangementCommandExecuted.Command)).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is ArrangementNoteCommandExecuted arrangementNoteCommandExecuted)
            {
                //TODO: Implement -- requires coordination with underlying resource service via emitting IFormsResource commands
                //      (which are not executed by the ReferralModel but by its caller, the ReferralManager, in non-replay scenarios).
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
