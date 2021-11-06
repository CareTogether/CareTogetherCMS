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
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<RemovedRole>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            var volunteerFamilyEntryToUpsert = command switch
            {
                //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                //      This involves returning "allowed actions" with the rendered Approval state
                //      and failing any attempted actions that are not allowed.
                ActivateVolunteerFamily c => volunteerFamilyEntry, // This command is a no-op used to initialize the volunteer family entry
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
                RemoveVolunteerFamilyRole c => volunteerFamilyEntry with
                {
                    RemovedRoles = volunteerFamilyEntry.RemovedRoles.Add(
                        new RemovedRole(c.RoleName, c.Reason, c.AdditionalComments))
                },
                ResetVolunteerFamilyRole c => volunteerFamilyEntry with
                {
                    RemovedRoles = volunteerFamilyEntry.RemovedRoles.RemoveAll(x => x.RoleName == c.RoleName)
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
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId,
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<RemovedRole>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            if (!volunteerFamilyEntry.IndividualEntries.TryGetValue(command.PersonId, out var volunteerEntry))
                volunteerEntry = new VolunteerEntry(command.PersonId, true, "",
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<RemovedRole>.Empty);

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
                RemoveVolunteerRole c => volunteerEntry with
                {
                    RemovedRoles = volunteerEntry.RemovedRoles.Add(
                        new RemovedRole(c.RoleName, c.Reason, c.AdditionalComments))
                },
                ResetVolunteerRole c => volunteerEntry with
                {
                    RemovedRoles = volunteerEntry.RemovedRoles.RemoveAll(x => x.RoleName == c.RoleName)
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

        public VolunteerFamilyEntry? GetVolunteerFamilyEntry(Guid familyId) =>
            volunteerFamilies.TryGetValue(familyId, out var volunteerFamilyEntry) ? volunteerFamilyEntry : null;


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
