using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.V1Cases
{
    [JsonHierarchyBase]
    public abstract partial record V1CaseEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record ReferralCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        V1CaseCommand Command
    ) : V1CaseEvent(UserId, TimestampUtc);

    public sealed record ArrangementsCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        ArrangementsCommand Command
    ) : V1CaseEvent(UserId, TimestampUtc);

    public sealed record ReferralOpened(
        Guid UserId,
        DateTime AuditTimestampUtc,
        DateTime OpenedAtUtc
    ) : Activity(UserId, AuditTimestampUtc, OpenedAtUtc, null, null);

    public sealed record ReferralRequirementCompleted(
        Guid UserId,
        DateTime AuditTimestampUtc,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : Activity(UserId, AuditTimestampUtc, CompletedAtUtc, UploadedDocumentId, NoteId);

    public sealed record ArrangementRequirementCompleted(
        Guid UserId,
        DateTime AuditTimestampUtc,
        Guid ArrangementId,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : Activity(UserId, AuditTimestampUtc, CompletedAtUtc, UploadedDocumentId, NoteId);

    public sealed record ChildLocationChanged(
        Guid UserId,
        DateTime AuditTimestampUtc,
        Guid ArrangementId,
        DateTime ChangedAtUtc,
        Guid ChildLocationFamilyId,
        Guid ChildLocationReceivingAdultId,
        ChildLocationPlan Plan,
        Guid? NoteId
    ) : Activity(UserId, AuditTimestampUtc, ChangedAtUtc, null, NoteId);

    public sealed class V1CaseModel
    {
        private ImmutableDictionary<Guid, V1CaseEntry> v1Cases = ImmutableDictionary<
            Guid,
            V1CaseEntry
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<V1CaseModel> InitializeAsync(
            IAsyncEnumerable<(V1CaseEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            var model = new V1CaseModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }

        public (
            ReferralCommandExecuted Event,
            long SequenceNumber,
            V1CaseEntry V1CaseEntry,
            Action OnCommit
        ) ExecuteV1CaseCommand(V1CaseCommand command, Guid userId, DateTime timestampUtc)
        {
            (V1CaseEntry, Activity?) v1CaseEntryToUpsert = command switch
            {
                CreateReferral c => (
                    new V1CaseEntry(
                        c.ReferralId,
                        c.FamilyId,
                        OpenedAtUtc: c.OpenedAtUtc,
                        ClosedAtUtc: null,
                        CloseReason: null,
                        ImmutableList<CompletedRequirementInfo>.Empty,
                        ImmutableList<ExemptedRequirementInfo>.Empty,
                        ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                        ImmutableDictionary<Guid, ArrangementEntry>.Empty,
                        ImmutableList<Activity>.Empty,
                        Comments: null
                    ),
                    new ReferralOpened(userId, timestampUtc, c.OpenedAtUtc)
                ),
                _ => v1Cases.TryGetValue(command.ReferralId, out var v1CaseEntry)
                    ? command switch
                    {
                        CompleteReferralRequirement c => (
                            v1CaseEntry with
                            {
                                CompletedRequirements = v1CaseEntry.CompletedRequirements.Add(
                                    new CompletedRequirementInfo(
                                        userId,
                                        timestampUtc,
                                        c.CompletedRequirementId,
                                        c.RequirementName,
                                        c.CompletedAtUtc,
                                        ExpiresAtUtc: null,
                                        c.UploadedDocumentId,
                                        c.NoteId
                                    )
                                ),
                            },
                            new ReferralRequirementCompleted(
                                userId,
                                timestampUtc,
                                c.RequirementName,
                                c.CompletedAtUtc,
                                c.UploadedDocumentId,
                                c.NoteId
                            )
                        ),
                        MarkReferralRequirementIncomplete c => (
                            v1CaseEntry with
                            {
                                CompletedRequirements =
                                    v1CaseEntry.CompletedRequirements.RemoveAll(x =>
                                        x.RequirementName == c.RequirementName
                                        && x.CompletedRequirementId == c.CompletedRequirementId
                                    ),
                            },
                            null
                        ),
                        ExemptReferralRequirement c => (
                            v1CaseEntry with
                            {
                                ExemptedRequirements = v1CaseEntry.ExemptedRequirements.Add(
                                    new ExemptedRequirementInfo(
                                        userId,
                                        timestampUtc,
                                        c.RequirementName,
                                        DueDate: null,
                                        c.AdditionalComments,
                                        c.ExemptionExpiresAtUtc
                                    )
                                ),
                            },
                            null
                        ),
                        UnexemptReferralRequirement c => (
                            v1CaseEntry with
                            {
                                ExemptedRequirements = v1CaseEntry.ExemptedRequirements.RemoveAll(
                                    x => x.RequirementName == c.RequirementName
                                ),
                            },
                            null
                        ),
                        UpdateCustomReferralField c => (
                            v1CaseEntry with
                            {
                                CompletedCustomFields = v1CaseEntry.CompletedCustomFields.SetItem(
                                    c.CustomFieldName,
                                    new CompletedCustomFieldInfo(
                                        userId,
                                        timestampUtc,
                                        c.CompletedCustomFieldId,
                                        c.CustomFieldName,
                                        c.CustomFieldType,
                                        c.Value
                                    )
                                ),
                            },
                            null
                        ),
                        UpdateReferralComments c => (
                            v1CaseEntry with
                            {
                                Comments = c.Comments,
                            },
                            null
                        ),
                        CloseReferral c => (
                            v1CaseEntry with
                            {
                                CloseReason = c.CloseReason,
                                ClosedAtUtc = c.ClosedAtUtc,
                            },
                            null
                        ),
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented."
                        ),
                    }
                    : throw new KeyNotFoundException(
                        "A v1 case with the specified ID does not exist."
                    ),
            };

            return (
                Event: new ReferralCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                V1CaseEntry: v1CaseEntryToUpsert.Item1 with
                {
                    History =
                        v1CaseEntryToUpsert.Item2 == null
                            ? v1CaseEntryToUpsert.Item1.History
                            : v1CaseEntryToUpsert.Item1.History.Add(v1CaseEntryToUpsert.Item2),
                },
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    v1Cases = v1Cases.SetItem(
                        v1CaseEntryToUpsert.Item1.Id,
                        v1CaseEntryToUpsert.Item1 with
                        {
                            History =
                                v1CaseEntryToUpsert.Item2 == null
                                    ? v1CaseEntryToUpsert.Item1.History
                                    : v1CaseEntryToUpsert.Item1.History.Add(
                                        v1CaseEntryToUpsert.Item2
                                    ),
                        }
                    );
                }
            );
        }

        public (
            ArrangementsCommandExecuted Event,
            long SequenceNumber,
            V1CaseEntry V1CaseEntry,
            Action OnCommit
        ) ExecuteArrangementsCommand(
            ArrangementsCommand command,
            Guid userId,
            DateTime timestampUtc
        )
        {
            if (!v1Cases.TryGetValue(command.ReferralId, out var v1CaseEntry))
                throw new KeyNotFoundException("A referral with the specified ID does not exist.");

            //TODO: Generate aggregated activities for the referral history, instead of per-arrangement activity entries?
            var arrangementEntriesToUpsert = command
                .ArrangementIds.Select<Guid, (ArrangementEntry, Activity?)>(arrangementId =>
                    command switch
                    {
                        CreateArrangement c => (
                            new ArrangementEntry(
                                arrangementId,
                                c.ArrangementType,
                                Active: true,
                                RequestedAtUtc: c.RequestedAtUtc,
                                StartedAtUtc: null,
                                EndedAtUtc: null,
                                CancelledAtUtc: null,
                                PlannedStartUtc: null,
                                PlannedEndUtc: null,
                                c.PartneringFamilyPersonId,
                                ImmutableList<CompletedRequirementInfo>.Empty,
                                ImmutableList<ExemptedRequirementInfo>.Empty,
                                ImmutableList<IndividualVolunteerAssignment>.Empty,
                                ImmutableList<FamilyVolunteerAssignment>.Empty,
                                ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                                ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                                Comments: null,
                                Reason: c.Reason
                            ),
                            null
                        ),
                        _ => v1CaseEntry.Arrangements.TryGetValue(
                            arrangementId,
                            out var arrangementEntry
                        )
                            ? command switch
                            {
                                AssignIndividualVolunteer c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.Add(
                                                new IndividualVolunteerAssignment(
                                                    c.VolunteerFamilyId,
                                                    c.PersonId,
                                                    c.ArrangementFunction,
                                                    c.ArrangementFunctionVariant,
                                                    ImmutableList<CompletedRequirementInfo>.Empty,
                                                    ImmutableList<ExemptedRequirementInfo>.Empty
                                                )
                                            ),
                                    },
                                    null
                                ),
                                AssignVolunteerFamily c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.Add(
                                                new FamilyVolunteerAssignment(
                                                    c.VolunteerFamilyId,
                                                    c.ArrangementFunction,
                                                    c.ArrangementFunctionVariant,
                                                    ImmutableList<CompletedRequirementInfo>.Empty,
                                                    ImmutableList<ExemptedRequirementInfo>.Empty
                                                )
                                            ),
                                    },
                                    null
                                ),
                                UnassignIndividualVolunteer c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.RemoveAll(
                                                iva =>
                                                    iva.ArrangementFunction == c.ArrangementFunction
                                                    && iva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && iva.FamilyId == c.VolunteerFamilyId
                                                    && iva.PersonId == c.PersonId
                                            ),
                                    },
                                    null
                                ),
                                UnassignVolunteerFamily c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.RemoveAll(
                                                fva =>
                                                    fva.ArrangementFunction == c.ArrangementFunction
                                                    && fva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && fva.FamilyId == c.VolunteerFamilyId
                                            ),
                                    },
                                    null
                                ),
                                PlanArrangementStart c => (
                                    arrangementEntry with
                                    {
                                        PlannedStartUtc = c.PlannedStartUtc,
                                    },
                                    null
                                ),
                                StartArrangements c => (
                                    arrangementEntry with
                                    {
                                        StartedAtUtc = c.StartedAtUtc,
                                    },
                                    null
                                ),
                                EditArrangementStartTime c => (
                                    arrangementEntry with
                                    {
                                        StartedAtUtc = c.StartedAtUtc,
                                    },
                                    null
                                ),
                                EditArrangementEndTime c => (
                                    arrangementEntry with
                                    {
                                        EndedAtUtc = c.EndedAtUtc,
                                    },
                                    null
                                ),
                                EditArrangementRequestedAt c => (
                                    arrangementEntry with
                                    {
                                        RequestedAtUtc = c.RequestedAtUtc,
                                    },
                                    null
                                ),
                                EditArrangementCancelledAt c => (
                                    arrangementEntry with
                                    {
                                        CancelledAtUtc = c.CancelledAtUtc,
                                    },
                                    null
                                ),
                                CompleteArrangementRequirement c => (
                                    arrangementEntry with
                                    {
                                        CompletedRequirements =
                                            arrangementEntry.CompletedRequirements.Add(
                                                new CompletedRequirementInfo(
                                                    userId,
                                                    timestampUtc,
                                                    c.CompletedRequirementId,
                                                    c.RequirementName,
                                                    c.CompletedAtUtc,
                                                    ExpiresAtUtc: null,
                                                    c.UploadedDocumentId,
                                                    c.NoteId
                                                )
                                            ),
                                    },
                                    new ArrangementRequirementCompleted(
                                        userId,
                                        timestampUtc,
                                        arrangementId,
                                        c.RequirementName,
                                        c.CompletedAtUtc,
                                        c.UploadedDocumentId,
                                        c.NoteId
                                    )
                                ),
                                CompleteVolunteerFamilyAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                                fva =>
                                                    fva.ArrangementFunction == c.ArrangementFunction
                                                    && fva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && fva.FamilyId == c.VolunteerFamilyId,
                                                fva =>
                                                    fva with
                                                    {
                                                        CompletedRequirements =
                                                            fva.CompletedRequirements.Add(
                                                                new CompletedRequirementInfo(
                                                                    userId,
                                                                    timestampUtc,
                                                                    c.CompletedRequirementId,
                                                                    c.RequirementName,
                                                                    c.CompletedAtUtc,
                                                                    ExpiresAtUtc: null,
                                                                    c.UploadedDocumentId,
                                                                    c.NoteId
                                                                )
                                                            ),
                                                    }
                                            ),
                                    },
                                    new ArrangementRequirementCompleted(
                                        userId,
                                        timestampUtc,
                                        arrangementId,
                                        c.RequirementName,
                                        c.CompletedAtUtc,
                                        c.UploadedDocumentId,
                                        c.NoteId
                                    )
                                ),
                                CompleteIndividualVolunteerAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                                iva =>
                                                    iva.ArrangementFunction == c.ArrangementFunction
                                                    && iva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && iva.FamilyId == c.VolunteerFamilyId
                                                    && iva.PersonId == c.PersonId,
                                                iva =>
                                                    iva with
                                                    {
                                                        CompletedRequirements =
                                                            iva.CompletedRequirements.Add(
                                                                new CompletedRequirementInfo(
                                                                    userId,
                                                                    timestampUtc,
                                                                    c.CompletedRequirementId,
                                                                    c.RequirementName,
                                                                    c.CompletedAtUtc,
                                                                    ExpiresAtUtc: null,
                                                                    c.UploadedDocumentId,
                                                                    c.NoteId
                                                                )
                                                            ),
                                                    }
                                            ),
                                    },
                                    new ArrangementRequirementCompleted(
                                        userId,
                                        timestampUtc,
                                        arrangementId,
                                        c.RequirementName,
                                        c.CompletedAtUtc,
                                        c.UploadedDocumentId,
                                        c.NoteId
                                    )
                                ),
                                MarkArrangementRequirementIncomplete c => (
                                    arrangementEntry with
                                    {
                                        CompletedRequirements =
                                            arrangementEntry.CompletedRequirements.RemoveAll(x =>
                                                x.RequirementName == c.RequirementName
                                                && x.CompletedRequirementId
                                                    == c.CompletedRequirementId
                                            ),
                                    },
                                    null
                                ),
                                MarkVolunteerFamilyAssignmentRequirementIncomplete c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                                fva =>
                                                    fva.ArrangementFunction == c.ArrangementFunction
                                                    && fva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && fva.FamilyId == c.VolunteerFamilyId,
                                                fva =>
                                                    fva with
                                                    {
                                                        CompletedRequirements =
                                                            fva.CompletedRequirements.RemoveAll(x =>
                                                                x.RequirementName
                                                                    == c.RequirementName
                                                                && x.CompletedRequirementId
                                                                    == c.CompletedRequirementId
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                MarkIndividualVolunteerAssignmentRequirementIncomplete c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                                iva =>
                                                    iva.ArrangementFunction == c.ArrangementFunction
                                                    && iva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && iva.FamilyId == c.VolunteerFamilyId
                                                    && iva.PersonId == c.PersonId,
                                                iva =>
                                                    iva with
                                                    {
                                                        CompletedRequirements =
                                                            iva.CompletedRequirements.RemoveAll(x =>
                                                                x.RequirementName
                                                                    == c.RequirementName
                                                                && x.CompletedRequirementId
                                                                    == c.CompletedRequirementId
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                ExemptArrangementRequirement c => (
                                    arrangementEntry with
                                    {
                                        ExemptedRequirements =
                                            arrangementEntry.ExemptedRequirements.Add(
                                                new ExemptedRequirementInfo(
                                                    userId,
                                                    timestampUtc,
                                                    c.RequirementName,
                                                    c.DueDate,
                                                    c.AdditionalComments,
                                                    c.ExemptionExpiresAtUtc
                                                )
                                            ),
                                    },
                                    null
                                ),
                                ExemptVolunteerFamilyAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                                fva =>
                                                    fva.ArrangementFunction == c.ArrangementFunction
                                                    && fva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && fva.FamilyId == c.VolunteerFamilyId,
                                                fva =>
                                                    fva with
                                                    {
                                                        ExemptedRequirements =
                                                            fva.ExemptedRequirements.Add(
                                                                new ExemptedRequirementInfo(
                                                                    userId,
                                                                    timestampUtc,
                                                                    c.RequirementName,
                                                                    c.DueDate,
                                                                    c.AdditionalComments,
                                                                    c.ExemptionExpiresAtUtc
                                                                )
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                ExemptIndividualVolunteerAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                                iva =>
                                                    iva.ArrangementFunction == c.ArrangementFunction
                                                    && iva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && iva.FamilyId == c.VolunteerFamilyId
                                                    && iva.PersonId == c.PersonId,
                                                iva =>
                                                    iva with
                                                    {
                                                        ExemptedRequirements =
                                                            iva.ExemptedRequirements.Add(
                                                                new ExemptedRequirementInfo(
                                                                    userId,
                                                                    timestampUtc,
                                                                    c.RequirementName,
                                                                    c.DueDate,
                                                                    c.AdditionalComments,
                                                                    c.ExemptionExpiresAtUtc
                                                                )
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                UnexemptArrangementRequirement c => (
                                    arrangementEntry with
                                    {
                                        ExemptedRequirements =
                                            arrangementEntry.ExemptedRequirements.RemoveAll(x =>
                                                x.RequirementName == c.RequirementName
                                                && x.DueDate == c.DueDate
                                            ),
                                    },
                                    null
                                ),
                                UnexemptVolunteerFamilyAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        FamilyVolunteerAssignments =
                                            arrangementEntry.FamilyVolunteerAssignments.UpdateSingle(
                                                fva =>
                                                    fva.ArrangementFunction == c.ArrangementFunction
                                                    && fva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && fva.FamilyId == c.VolunteerFamilyId,
                                                fva =>
                                                    fva with
                                                    {
                                                        ExemptedRequirements =
                                                            fva.ExemptedRequirements.RemoveAll(x =>
                                                                x.RequirementName
                                                                    == c.RequirementName
                                                                && x.DueDate == c.DueDate
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                UnexemptIndividualVolunteerAssignmentRequirement c => (
                                    arrangementEntry with
                                    {
                                        IndividualVolunteerAssignments =
                                            arrangementEntry.IndividualVolunteerAssignments.UpdateSingle(
                                                iva =>
                                                    iva.ArrangementFunction == c.ArrangementFunction
                                                    && iva.ArrangementFunctionVariant
                                                        == c.ArrangementFunctionVariant
                                                    && iva.FamilyId == c.VolunteerFamilyId
                                                    && iva.PersonId == c.PersonId,
                                                iva =>
                                                    iva with
                                                    {
                                                        ExemptedRequirements =
                                                            iva.ExemptedRequirements.RemoveAll(x =>
                                                                x.RequirementName
                                                                    == c.RequirementName
                                                                && x.DueDate == c.DueDate
                                                            ),
                                                    }
                                            ),
                                    },
                                    null
                                ),
                                PlanChildLocationChange c => (
                                    arrangementEntry with
                                    {
                                        ChildLocationPlan = arrangementEntry.ChildLocationPlan.Add(
                                            new ChildLocationHistoryEntry(
                                                userId,
                                                c.PlannedChangeUtc,
                                                c.ChildLocationFamilyId,
                                                c.ChildLocationReceivingAdultId,
                                                c.Plan,
                                                NoteId: null
                                            )
                                        ),
                                    },
                                    null
                                ),
                                DeletePlannedChildLocationChange c => (
                                    arrangementEntry with
                                    {
                                        ChildLocationPlan =
                                            arrangementEntry.ChildLocationPlan.Remove(
                                                arrangementEntry.ChildLocationPlan.Last(entry =>
                                                    entry.ChildLocationFamilyId
                                                        == c.ChildLocationFamilyId
                                                    && entry.ChildLocationReceivingAdultId
                                                        == c.ChildLocationReceivingAdultId
                                                    && entry.TimestampUtc == c.PlannedChangeUtc
                                                )
                                            ),
                                    },
                                    null
                                ),
                                TrackChildLocationChange c => (
                                    arrangementEntry with
                                    {
                                        ChildLocationHistory =
                                            arrangementEntry.ChildLocationHistory.Add(
                                                new ChildLocationHistoryEntry(
                                                    userId,
                                                    c.ChangedAtUtc,
                                                    c.ChildLocationFamilyId,
                                                    c.ChildLocationReceivingAdultId,
                                                    c.Plan,
                                                    c.NoteId
                                                )
                                            ),
                                    },
                                    new ChildLocationChanged(
                                        userId,
                                        timestampUtc,
                                        arrangementId,
                                        c.ChangedAtUtc,
                                        c.ChildLocationFamilyId,
                                        c.ChildLocationReceivingAdultId,
                                        c.Plan,
                                        c.NoteId
                                    )
                                ),
                                DeleteChildLocationChange c => (
                                    arrangementEntry with
                                    {
                                        ChildLocationHistory =
                                            arrangementEntry.ChildLocationHistory.Remove(
                                                arrangementEntry.ChildLocationHistory.Last(entry =>
                                                    entry.ChildLocationFamilyId
                                                        == c.ChildLocationFamilyId
                                                    && entry.ChildLocationReceivingAdultId
                                                        == c.ChildLocationReceivingAdultId
                                                    && entry.TimestampUtc == c.ChangedAtUtc
                                                )
                                            ),
                                    },
                                    null
                                ),
                                PlanArrangementEnd c => (
                                    arrangementEntry with
                                    {
                                        PlannedEndUtc = c.PlannedEndUtc,
                                    },
                                    null
                                ),
                                EndArrangements c => (
                                    arrangementEntry with
                                    {
                                        //TODO: Enforce invariant - cannot end before starting
                                        EndedAtUtc = c.EndedAtUtc,
                                    },
                                    null
                                ),
                                ReopenArrangements c => (
                                    arrangementEntry with
                                    {
                                        EndedAtUtc = null,
                                    },
                                    null
                                ),
                                CancelArrangementsSetup c => (
                                    arrangementEntry with
                                    {
                                        //TODO: Enforce invariant - cannot cancel after starting
                                        CancelledAtUtc = c.CancelledAtUtc,
                                    },
                                    null
                                ),
                                UpdateArrangementComments c => (
                                    arrangementEntry with
                                    {
                                        Comments = c.Comments,
                                    },
                                    null
                                ),
                                EditArrangementReason c => (
                                    arrangementEntry with
                                    {
                                        Reason = c.Reason,
                                    },
                                    null
                                ),
                                DeleteArrangements c => (
                                    arrangementEntry with
                                    {
                                        Active = false,
                                    },
                                    null
                                ),
                                _ => throw new NotImplementedException(
                                    $"The command type '{command.GetType().FullName}' has not been implemented."
                                ),
                            }
                            : throw new KeyNotFoundException(
                                "An arrangement with the specified ID does not exist."
                            ),
                    }
                )
                .ToImmutableList();

            var v1CaseEntryToUpsert = v1CaseEntry with
            {
                Arrangements = v1CaseEntry.Arrangements.SetItems(
                    arrangementEntriesToUpsert.Select(e => new KeyValuePair<Guid, ArrangementEntry>(
                        e.Item1.Id,
                        e.Item1
                    ))
                ),
                History = v1CaseEntry.History.AddRange(
                    arrangementEntriesToUpsert
                        .Select(e => e.Item2)
                        .Where(activity => activity != null)
                        .Cast<Activity>()
                ),
            };
            return (
                Event: new ArrangementsCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                V1CaseEntry: v1CaseEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    v1Cases = v1Cases.SetItem(v1CaseEntryToUpsert.Id, v1CaseEntryToUpsert);
                }
            );
        }

        public ImmutableList<V1CaseEntry> FindV1CaseEntries(Func<V1CaseEntry, bool> predicate)
        {
            return v1Cases.Values.Where(predicate).ToImmutableList();
        }

        public V1CaseEntry GetV1CaseEntry(Guid v1CaseId) => v1Cases[v1CaseId];

        private void ReplayEvent(V1CaseEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is ReferralCommandExecuted referralCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteV1CaseCommand(
                    referralCommandExecuted.Command,
                    referralCommandExecuted.UserId,
                    referralCommandExecuted.TimestampUtc
                );
                onCommit();
            }
            else if (domainEvent is ArrangementsCommandExecuted arrangementCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteArrangementsCommand(
                    arrangementCommandExecuted.Command,
                    arrangementCommandExecuted.UserId,
                    arrangementCommandExecuted.TimestampUtc
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
