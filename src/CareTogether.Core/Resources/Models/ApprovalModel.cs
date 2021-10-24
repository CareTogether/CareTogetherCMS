using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Models
{
    [JsonHierarchyBase]
    public abstract partial record ApprovalEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record VolunteerFamilyCommandExecuted(Guid UserId, DateTime TimestampUtc,
        VolunteerFamilyCommand Command) : ApprovalEvent(UserId, TimestampUtc);
    public sealed record VolunteerCommandExecuted(Guid UserId, DateTime TimestampUtc,
        VolunteerCommand Command) : ApprovalEvent(UserId, TimestampUtc);

    public sealed class ApprovalModel
    {
        private ImmutableDictionary<Guid, VolunteerFamilyEntry> volunteerFamilies = ImmutableDictionary<Guid, VolunteerFamilyEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<ApprovalModel> InitializeAsync(
            IAsyncEnumerable<(ApprovalEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new ApprovalModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public (VolunteerFamilyCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)
            ExecuteVolunteerFamilyCommand(VolunteerFamilyCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!volunteerFamilies.TryGetValue(command.FamilyId, out var volunteerFamilyEntry))
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId, VolunteerFamilyStatus.Inactive, "",
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            var volunteerFamilyEntryToUpsert = command switch
            {
                //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                //      This involves returning "allowed actions" with the rendered Approval state
                //      and failing any attempted actions that are not allowed.
                CompleteVolunteerFamilyRequirement c => volunteerFamilyEntry with
                {
                    CompletedRequirements = volunteerFamilyEntry.CompletedRequirements.Add(
                        new CompletedRequirementInfo(userId, timestampUtc, c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                },
                UploadVolunteerFamilyDocument c => volunteerFamilyEntry with
                {
                    UploadedDocuments = volunteerFamilyEntry.UploadedDocuments.Add(
                        new UploadedDocumentInfo(userId, timestampUtc, c.UploadedDocumentId, c.UploadedFileName))
                },
                DeactivateVolunteerFamily c => volunteerFamilyEntry with
                {
                    Status = VolunteerFamilyStatus.Inactive,
                },
                ActivateVolunteerFamily c => volunteerFamilyEntry with
                {
                    Status = VolunteerFamilyStatus.Active,
                },
                SetVolunteerFamilyNote c => volunteerFamilyEntry with
                {
                    Note = c.Note
                },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };
            
            return (
                Event: new VolunteerFamilyCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                VolunteerFamilyEntry: volunteerFamilyEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    volunteerFamilies = volunteerFamilies.SetItem(volunteerFamilyEntryToUpsert.FamilyId, volunteerFamilyEntryToUpsert);
                });
        }

        public (VolunteerCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)
            ExecuteVolunteerCommand(VolunteerCommand command, Guid userId, DateTime timestampUtc)
        {
            if (!volunteerFamilies.TryGetValue(command.FamilyId, out var volunteerFamilyEntry))
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId, VolunteerFamilyStatus.Active, "",
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            if (!volunteerFamilyEntry.IndividualEntries.TryGetValue(command.PersonId, out var volunteerEntry))
                volunteerEntry = new VolunteerEntry(command.PersonId, true, "",
                    ImmutableList<CompletedRequirementInfo>.Empty);

            var volunteerEntryToUpsert = command switch
            {
                //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                //      This involves returning "allowed actions" with the rendered Approval state
                //      and failing any attempted actions that are not allowed.
                CompleteVolunteerRequirement c => volunteerEntry with
                {
                    CompletedRequirements = volunteerEntry.CompletedRequirements.Add(
                        new CompletedRequirementInfo(userId, timestampUtc, c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                },
                DeactivateVolunteer c => volunteerEntry with
                {
                    Active = false,
                },
                ReactivateVolunteer c => volunteerEntry with
                {
                    Active = true,
                },
                SetVolunteerNote c => volunteerEntry with
                {
                    Note = c.Note
                },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };

            var volunteerFamilyEntryToUpsert = volunteerFamilyEntry with
            {
                IndividualEntries = volunteerFamilyEntry.IndividualEntries.SetItem(command.PersonId, volunteerEntryToUpsert)
            };
            return (
                Event: new VolunteerCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                VolunteerFamilyEntry: volunteerFamilyEntryToUpsert,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    volunteerFamilies = volunteerFamilies.SetItem(volunteerFamilyEntryToUpsert.FamilyId, volunteerFamilyEntryToUpsert);
                });
        }

        public ImmutableList<VolunteerFamilyEntry> FindVolunteerFamilyEntries(Func<VolunteerFamilyEntry, bool> predicate)
        {
            return volunteerFamilies.Values
                .Where(predicate)
                .ToImmutableList();
        }

        public VolunteerFamilyEntry GetVolunteerFamilyEntry(Guid familyId) => volunteerFamilies[familyId];


        private void ReplayEvent(ApprovalEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is VolunteerFamilyCommandExecuted volunteerFamilyCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteVolunteerFamilyCommand(volunteerFamilyCommandExecuted.Command,
                    volunteerFamilyCommandExecuted.UserId, volunteerFamilyCommandExecuted.TimestampUtc);
                onCommit();
            }
            else if (domainEvent is VolunteerCommandExecuted volunteerCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteVolunteerCommand(volunteerCommandExecuted.Command,
                    volunteerCommandExecuted.UserId, volunteerCommandExecuted.TimestampUtc);
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
