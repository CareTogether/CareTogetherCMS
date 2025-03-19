using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Referrals
{
    [JsonHierarchyBase]
    public abstract partial record ReferralEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record ReferralCommandExecuted(Guid UserId, DateTime TimestampUtc,
        ReferralCommand Command) : ReferralEvent(UserId, TimestampUtc);
    public sealed record ArrangementsCommandExecuted(Guid UserId, DateTime TimestampUtc,
        ArrangementsCommand Command) : ReferralEvent(UserId, TimestampUtc);

    public sealed record ReferralOpened(Guid UserId, DateTime AuditTimestampUtc,
        DateTime OpenedAtUtc)
        : Activity(UserId, AuditTimestampUtc, OpenedAtUtc, null, null);
    public sealed record ReferralRequirementCompleted(Guid UserId, DateTime AuditTimestampUtc,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId, Guid? NoteId)
        : Activity(UserId, AuditTimestampUtc, CompletedAtUtc, UploadedDocumentId, NoteId);
    public sealed record ArrangementRequirementCompleted(Guid UserId, DateTime AuditTimestampUtc, Guid ArrangementId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId, Guid? NoteId)
        : Activity(UserId, AuditTimestampUtc, CompletedAtUtc, UploadedDocumentId, NoteId);
    public sealed record ChildLocationChanged(Guid UserId, DateTime AuditTimestampUtc, Guid ArrangementId,
        DateTime ChangedAtUtc, Guid ChildLocationFamilyId, Guid ChildLocationReceivingAdultId, ChildLocationPlan Plan, Guid? NoteId)
        : Activity(UserId, AuditTimestampUtc, ChangedAtUtc, null, NoteId);

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
            (ReferralEntry, Activity?) referralEntryToUpsert = command switch
            {
                CreateReferral c => (new ReferralEntry(c.ReferralId, c.FamilyId,
                    OpenedAtUtc: c.OpenedAtUtc, ClosedAtUtc: null, CloseReason: null,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty,
                    ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                    ImmutableDictionary<Guid, ArrangementEntry>.Empty, ImmutableList<Activity>.Empty,
                    Comments: null),
                        new ReferralOpened(userId, timestampUtc, c.OpenedAtUtc)),
                _ => referrals.TryGetValue(command.ReferralId, out var referralEntry)
                    ? command switch
                    {
                        CompleteReferralRequirement c => (referralEntry with
                        {
                            CompletedRequirements = referralEntry.CompletedRequirements.Add(
                                new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                    c.RequirementName, c.CompletedAtUtc, ExpiresAtUtc: null, c.UploadedDocumentId, c.NoteId))
                        }, new ReferralRequirementCompleted(userId, timestampUtc,
                            c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId, c.NoteId)),
                        MarkReferralRequirementIncomplete c => (referralEntry with
                        {
                            CompletedRequirements = referralEntry.CompletedRequirements.RemoveAll(x =>
                                x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                        }, null),
                        ExemptReferralRequirement c => (referralEntry with
                        {
                            ExemptedRequirements = referralEntry.ExemptedRequirements.Add(
                                new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, DueDate: null,
                                    c.AdditionalComments, c.ExemptionExpiresAtUtc))
                        }, null),
                        UnexemptReferralRequirement c => (referralEntry with
                        {
                            ExemptedRequirements = referralEntry.ExemptedRequirements.RemoveAll(x =>
                                x.RequirementName == c.RequirementName)
                        }, null),
                        UpdateCustomReferralField c => (referralEntry with
                        {
                            CompletedCustomFields = referralEntry.CompletedCustomFields.SetItem(
                                c.CustomFieldName,
                                new CompletedCustomFieldInfo(userId, timestampUtc, c.CompletedCustomFieldId,
                                    c.CustomFieldName, c.CustomFieldType, c.Value))
                        }, null),
                        UpdateReferralComments c => (referralEntry with
                        {
                            Comments = c.Comments
                        }, null),
                        CloseReferral c => (referralEntry with
                        {
                            CloseReason = c.CloseReason,
                            ClosedAtUtc = c.ClosedAtUtc
                        }, null),
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("A referral with the specified ID does not exist.")
            };

            return (
                Event: new ReferralCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                ReferralEntry: referralEntryToUpsert.Item1 with
                {
                    History = referralEntryToUpsert.Item2 == null
                    ? referralEntryToUpsert.Item1.History
                    : referralEntryToUpsert.Item1.History.Add(referralEntryToUpsert.Item2)
                },
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(referralEntryToUpsert.Item1.Id, referralEntryToUpsert.Item1 with
                    {
                        History = referralEntryToUpsert.Item2 == null
                        ? referralEntryToUpsert.Item1.History
                        : referralEntryToUpsert.Item1.History.Add(referralEntryToUpsert.Item2)
                    });
                }
            );
        }

        public (ArrangementsCommandExecuted Event, long SequenceNumber, ReferralEntry ReferralEntry, Action OnCommit)
            ExecuteArrangementsCommand(ArrangementsCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!referrals.TryGetValue(command.ReferralId, out var referralEntry))
                throw new KeyNotFoundException("A referral with the specified ID does not exist.");

            //TODO: Generate aggregated activities for the referral history, instead of per-arrangement activity entries?
            var arrangementEntriesToUpsert = command.ArrangementIds.Select<Guid, (ArrangementEntry, Activity?)>(arrangementId =>
                command switch
                {
                    CreateArrangement c => (new ArrangementEntry(arrangementId, c.ArrangementType, Active: true,
                        RequestedAtUtc: c.RequestedAtUtc, StartedAtUtc: null, EndedAtUtc: null,
                        CancelledAtUtc: null, PlannedStartUtc: null, PlannedEndUtc: null,
                        c.PartneringFamilyPersonId,
                        ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty,
                        ImmutableList<IndividualVolunteerAssignment>.Empty, ImmutableList<FamilyVolunteerAssignment>.Empty,
                        ImmutableSortedSet<ChildLocationHistoryEntry>.Empty, ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                        Comments: null, Reason: c.Reason),
                        null),
                    _ => referralEntry.Arrangements.TryGetValue(arrangementId, out var arrangementEntry)
                        ? command switch
                        {
                            AssignIndividualVolunteer c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.Add(
                                    new IndividualVolunteerAssignment(c.VolunteerFamilyId, c.PersonId,
                                        c.ArrangementFunction, c.ArrangementFunctionVariant,
                                        ImmutableList<CompletedRequirementInfo>.Empty,
                                        ImmutableList<ExemptedRequirementInfo>.Empty))
                            }, null),
                            AssignVolunteerFamily c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.Add(
                                    new FamilyVolunteerAssignment(c.VolunteerFamilyId,
                                        c.ArrangementFunction, c.ArrangementFunctionVariant,
                                        ImmutableList<CompletedRequirementInfo>.Empty,
                                        ImmutableList<ExemptedRequirementInfo>.Empty))
                            }, null),
                            UnassignIndividualVolunteer c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.RemoveAll(iva =>
                                    iva.ArrangementFunction == c.ArrangementFunction &&
                                    iva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                    iva.FamilyId == c.VolunteerFamilyId && iva.PersonId == c.PersonId)
                            }, null),
                            UnassignVolunteerFamily c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.RemoveAll(fva =>
                                    fva.ArrangementFunction == c.ArrangementFunction &&
                                    fva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                    fva.FamilyId == c.VolunteerFamilyId)
                            }, null),
                            PlanArrangementStart c => (arrangementEntry with
                            {
                                PlannedStartUtc = c.PlannedStartUtc
                            }, null),
                            StartArrangements c => (arrangementEntry with
                            {
                                StartedAtUtc = c.StartedAtUtc
                            }, null),
                            EditArrangementStartTime c => (arrangementEntry with
                            {
                                StartedAtUtc = c.StartedAtUtc
                            }, null),
                            CompleteArrangementRequirement c => (arrangementEntry with
                            {
                                CompletedRequirements = arrangementEntry.CompletedRequirements.Add(
                                    new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                        c.RequirementName, c.CompletedAtUtc, ExpiresAtUtc: null, c.UploadedDocumentId, c.NoteId))
                            }, new ArrangementRequirementCompleted(userId, timestampUtc, arrangementId,
                                c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId, c.NoteId)),
                            CompleteVolunteerFamilyAssignmentRequirement c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                    fva => fva.ArrangementFunction == c.ArrangementFunction &&
                                        fva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        fva.FamilyId == c.VolunteerFamilyId,
                                    fva => fva with
                                    {
                                        CompletedRequirements = fva.CompletedRequirements.Add(
                                            new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                                c.RequirementName, c.CompletedAtUtc, ExpiresAtUtc: null, c.UploadedDocumentId, c.NoteId))
                                    })
                            }, new ArrangementRequirementCompleted(userId, timestampUtc, arrangementId,
                                c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId, c.NoteId)),
                            CompleteIndividualVolunteerAssignmentRequirement c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                    iva => iva.ArrangementFunction == c.ArrangementFunction &&
                                        iva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        iva.FamilyId == c.VolunteerFamilyId &&
                                        iva.PersonId == c.PersonId,
                                    iva => iva with
                                    {
                                        CompletedRequirements = iva.CompletedRequirements.Add(
                                            new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId,
                                                c.RequirementName, c.CompletedAtUtc, ExpiresAtUtc: null, c.UploadedDocumentId, c.NoteId))
                                    })
                            }, new ArrangementRequirementCompleted(userId, timestampUtc, arrangementId,
                                c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId, c.NoteId)),
                            MarkArrangementRequirementIncomplete c => (arrangementEntry with
                            {
                                CompletedRequirements = arrangementEntry.CompletedRequirements.RemoveAll(x =>
                                    x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                            }, null),
                            MarkVolunteerFamilyAssignmentRequirementIncomplete c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                    fva => fva.ArrangementFunction == c.ArrangementFunction &&
                                        fva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        fva.FamilyId == c.VolunteerFamilyId,
                                    fva => fva with
                                    {
                                        CompletedRequirements = fva.CompletedRequirements.RemoveAll(x =>
                                            x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                                    })
                            }, null),
                            MarkIndividualVolunteerAssignmentRequirementIncomplete c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                    iva => iva.ArrangementFunction == c.ArrangementFunction &&
                                        iva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        iva.FamilyId == c.VolunteerFamilyId &&
                                        iva.PersonId == c.PersonId,
                                    iva => iva with
                                    {
                                        CompletedRequirements = iva.CompletedRequirements.RemoveAll(x =>
                                            x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                                    })
                            }, null),
                            ExemptArrangementRequirement c => (arrangementEntry with
                            {
                                ExemptedRequirements = arrangementEntry.ExemptedRequirements.Add(
                                    new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, c.DueDate,
                                        c.AdditionalComments, c.ExemptionExpiresAtUtc))
                            }, null),
                            ExemptVolunteerFamilyAssignmentRequirement c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                    fva => fva.ArrangementFunction == c.ArrangementFunction &&
                                        fva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        fva.FamilyId == c.VolunteerFamilyId,
                                    fva => fva with
                                    {
                                        ExemptedRequirements = fva.ExemptedRequirements.Add(
                                            new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, c.DueDate,
                                                c.AdditionalComments, c.ExemptionExpiresAtUtc))
                                    })

                            }, null),
                            ExemptIndividualVolunteerAssignmentRequirement c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                    iva => iva.ArrangementFunction == c.ArrangementFunction &&
                                        iva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        iva.FamilyId == c.VolunteerFamilyId &&
                                        iva.PersonId == c.PersonId,
                                    iva => iva with
                                    {
                                        ExemptedRequirements = iva.ExemptedRequirements.Add(
                                            new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, c.DueDate,
                                                c.AdditionalComments, c.ExemptionExpiresAtUtc))
                                    })
                            }, null),
                            UnexemptArrangementRequirement c => (arrangementEntry with
                            {
                                ExemptedRequirements = arrangementEntry.ExemptedRequirements.RemoveAll(x =>
                                    x.RequirementName == c.RequirementName && x.DueDate == c.DueDate)
                            }, null),
                            UnexemptVolunteerFamilyAssignmentRequirement c => (arrangementEntry with
                            {
                                FamilyVolunteerAssignments = arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                    fva => fva.ArrangementFunction == c.ArrangementFunction &&
                                        fva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        fva.FamilyId == c.VolunteerFamilyId,
                                    fva => fva with
                                    {
                                        ExemptedRequirements = fva.ExemptedRequirements.RemoveAll(x =>
                                            x.RequirementName == c.RequirementName && x.DueDate == c.DueDate)
                                    })
                            }, null),
                            UnexemptIndividualVolunteerAssignmentRequirement c => (arrangementEntry with
                            {
                                IndividualVolunteerAssignments = arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                    iva => iva.ArrangementFunction == c.ArrangementFunction &&
                                        iva.ArrangementFunctionVariant == c.ArrangementFunctionVariant &&
                                        iva.FamilyId == c.VolunteerFamilyId &&
                                        iva.PersonId == c.PersonId,
                                    iva => iva with
                                    {
                                        ExemptedRequirements = iva.ExemptedRequirements.RemoveAll(x =>
                                            x.RequirementName == c.RequirementName && x.DueDate == c.DueDate)
                                    })
                            }, null),
                            PlanChildLocationChange c => (arrangementEntry with
                            {
                                ChildLocationPlan = arrangementEntry.ChildLocationPlan.Add(
                                    new ChildLocationHistoryEntry(userId, c.PlannedChangeUtc,
                                        c.ChildLocationFamilyId, c.ChildLocationReceivingAdultId, c.Plan, NoteId: null))
                            }, null),
                            DeletePlannedChildLocationChange c => (arrangementEntry with
                            {
                                ChildLocationPlan = arrangementEntry.ChildLocationPlan.Remove(
                                    arrangementEntry.ChildLocationPlan.Last(entry =>
                                        entry.ChildLocationFamilyId == c.ChildLocationFamilyId &&
                                        entry.ChildLocationReceivingAdultId == c.ChildLocationReceivingAdultId &&
                                        entry.TimestampUtc == c.PlannedChangeUtc))
                            }, null),
                            TrackChildLocationChange c => (arrangementEntry with
                            {
                                ChildLocationHistory = arrangementEntry.ChildLocationHistory.Add(
                                    new ChildLocationHistoryEntry(userId, c.ChangedAtUtc,
                                        c.ChildLocationFamilyId, c.ChildLocationReceivingAdultId, c.Plan, c.NoteId))
                            }, new ChildLocationChanged(userId, timestampUtc, arrangementId,
                                c.ChangedAtUtc, c.ChildLocationFamilyId, c.ChildLocationReceivingAdultId, c.Plan, c.NoteId)),
                            DeleteChildLocationChange c => (arrangementEntry with
                            {
                                ChildLocationHistory = arrangementEntry.ChildLocationHistory.Remove(
                                    arrangementEntry.ChildLocationHistory.Last(entry =>
                                        entry.ChildLocationFamilyId == c.ChildLocationFamilyId &&
                                        entry.ChildLocationReceivingAdultId == c.ChildLocationReceivingAdultId &&
                                        entry.TimestampUtc == c.ChangedAtUtc))
                            }, null),
                            PlanArrangementEnd c => (arrangementEntry with
                            {
                                PlannedEndUtc = c.PlannedEndUtc
                            }, null),
                            EndArrangements c => (arrangementEntry with
                            {
                                //TODO: Enforce invariant - cannot end before starting
                                EndedAtUtc = c.EndedAtUtc
                            }, null),
                            ReopenArrangements c => (arrangementEntry with
                            {
                                EndedAtUtc = null
                            }, null),
                            CancelArrangementsSetup c => (arrangementEntry with
                            {
                                //TODO: Enforce invariant - cannot cancel after starting
                                CancelledAtUtc = c.CancelledAtUtc
                            }, null),
                            UpdateArrangementComments c => (arrangementEntry with
                            {
                                Comments = c.Comments
                            }, null),
                            EditArrangementReason c => (arrangementEntry with
                            {
                                Reason = c.Reason
                            }, null),
                            DeleteArrangements c => (arrangementEntry with
                            {
                                Active = false
                            }, null),
                            _ => throw new NotImplementedException(
                                $"The command type '{command.GetType().FullName}' has not been implemented.")
                        }
                        : throw new KeyNotFoundException("An arrangement with the specified ID does not exist.")
                }).ToImmutableList();

            var referralEntryToUpsert = referralEntry with
            {
                Arrangements = referralEntry.Arrangements.SetItems(
                    arrangementEntriesToUpsert.Select(e =>
                        new KeyValuePair<Guid, ArrangementEntry>(e.Item1.Id, e.Item1))),
                History = referralEntry.History.AddRange(arrangementEntriesToUpsert
                    .Select(e => e.Item2)
                    .Where(activity => activity != null)
                    .Cast<Activity>())
            };
            return (
                Event: new ArrangementsCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                ReferralEntry: referralEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    referrals = referrals.SetItem(referralEntryToUpsert.Id, referralEntryToUpsert);
                }
            );
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
            else if (domainEvent is ArrangementsCommandExecuted arrangementCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementsCommand(arrangementCommandExecuted.Command,
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
