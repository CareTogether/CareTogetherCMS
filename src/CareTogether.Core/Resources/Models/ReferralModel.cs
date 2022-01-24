using JsonPolymorph;
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


        public (ReferralCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)
            ExecuteReferralCommand(ReferralCommand command, Guid userId, DateTime timestampUtc)
        {
            var referralEntryToUpsert = command switch
            {
                CreateReferral c => new ReferralEntry(c.ReferralId, c.FamilyId,
                    OpenedAtUtc: c.OpenedAtUtc, ClosedAtUtc: null, CloseReason: null,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty,
                    ImmutableDictionary<Guid, ArrangementEntry>.Empty),
                _ => referrals.TryGetValue(command.ReferralId, out var referralEntry)
                    ? command switch
                    {
                        CompleteReferralRequirement c => referralEntry with
                        {
                            CompletedRequirements = referralEntry.CompletedRequirements.Add(
                                new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                    c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                        },
                        ExemptReferralRequirement c => referralEntry with
                        {
                            ExemptedRequirements = referralEntry.ExemptedRequirements.Add(
                                new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, c.AdditionalComments, c.ExemptionExpiresAtUtc))
                        },
                        UnexemptReferralRequirement c => referralEntry with
                        {
                            ExemptedRequirements = referralEntry.ExemptedRequirements.RemoveAll(x =>
                                x.RequirementName == c.RequirementName)
                        },
                        CloseReferral c => referralEntry with
                        {
                            CloseReason = c.CloseReason,
                            ClosedAtUtc = c.ClosedAtUtc
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("A referral with the specified ID does not exist.")
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
                CreateArrangement c => new ArrangementEntry(c.ArrangementId, c.ArrangementType,
                    RequestedAtUtc: c.RequestedAtUtc, StartedAtUtc: null, EndedAtUtc: null,
                    c.PartneringFamilyPersonId,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty,
                    ImmutableList<IndividualVolunteerAssignment>.Empty, ImmutableList<FamilyVolunteerAssignment>.Empty,
                    ImmutableSortedSet<ChildLocationHistoryEntry>.Empty),
                _ => referralEntry.Arrangements.TryGetValue(command.ArrangementId, out var arrangementEntry)
                    ? command switch
                    {
                        AssignIndividualVolunteer c => arrangementEntry with
                        {
                            IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.Add(
                                new IndividualVolunteerAssignment(c.VolunteerFamilyId, c.PersonId, c.ArrangementFunction))
                        },
                        AssignVolunteerFamily c => arrangementEntry with
                        {
                            FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.Add(
                                new FamilyVolunteerAssignment(c.VolunteerFamilyId, c.ArrangementFunction))
                        },
                        StartArrangement c => arrangementEntry with
                        {
                            StartedAtUtc = c.StartedAtUtc
                        },
                        CompleteArrangementRequirement c => arrangementEntry with
                        {
                            CompletedRequirements = arrangementEntry.CompletedRequirements.Add(
                                new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                    c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                        },
                        ExemptArrangementRequirement c => arrangementEntry with
                        {
                            ExemptedRequirements = arrangementEntry.ExemptedRequirements.Add(
                                new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, c.AdditionalComments, c.ExemptionExpiresAtUtc))
                        },
                        UnexemptArrangementRequirement c => arrangementEntry with
                        {
                            ExemptedRequirements = arrangementEntry.ExemptedRequirements.RemoveAll(x =>
                                x.RequirementName == c.RequirementName)
                        },
                        TrackChildLocationChange c => arrangementEntry with
                        {
                            ChildrenLocationHistory = arrangementEntry.ChildrenLocationHistory.Add(
                                new ChildLocationHistoryEntry(userId, c.ChangedAtUtc,
                                    c.ChildLocationFamilyId, c.Plan, c.AdditionalExplanation))
                        },
                        EndArrangement c => arrangementEntry with
                        {
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
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
