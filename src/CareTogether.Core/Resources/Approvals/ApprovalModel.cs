using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Approvals
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
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<RemovedRole>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            var volunteerFamilyEntryToUpsert = command switch
            {
                // This command is a no-op used to initialize the volunteer family entry
                ActivateVolunteerFamily c => volunteerFamilyEntry,
                CompleteVolunteerFamilyRequirement c => volunteerFamilyEntry with
                {
                    CompletedRequirements = volunteerFamilyEntry.CompletedRequirements.Add(
                        new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId, c.RequirementName,
                            c.CompletedAtUtc, c.UploadedDocumentId))
                },
                MarkVolunteerFamilyRequirementIncomplete c => volunteerFamilyEntry with
                {
                    CompletedRequirements = volunteerFamilyEntry.CompletedRequirements.RemoveAll(x =>
                        x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                },
                ExemptVolunteerFamilyRequirement c => volunteerFamilyEntry with
                {
                    ExemptedRequirements = volunteerFamilyEntry.ExemptedRequirements.Add(
                        new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, DueDate: null,
                            c.AdditionalComments, c.ExemptionExpiresAtUtc))
                },
                UnexemptVolunteerFamilyRequirement c => volunteerFamilyEntry with
                {
                    ExemptedRequirements = volunteerFamilyEntry.ExemptedRequirements.RemoveAll(x =>
                        x.RequirementName == c.RequirementName)
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
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty, ImmutableList<UploadedDocumentInfo>.Empty,
                    ImmutableList<RemovedRole>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            if (!volunteerFamilyEntry.IndividualEntries.TryGetValue(command.PersonId, out var volunteerEntry))
                volunteerEntry = new VolunteerEntry(command.PersonId, true, "",
                    ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<ExemptedRequirementInfo>.Empty, ImmutableList<RemovedRole>.Empty);

            var volunteerEntryToUpsert = command switch
            {
                CompleteVolunteerRequirement c => volunteerEntry with
                {
                    CompletedRequirements = volunteerEntry.CompletedRequirements.Add(
                        new CompletedRequirementInfo(userId, timestampUtc, c.CompletedRequirementId, c.RequirementName, c.CompletedAtUtc, c.UploadedDocumentId))
                },
                MarkVolunteerRequirementIncomplete c => volunteerEntry with
                {
                    CompletedRequirements = volunteerEntry.CompletedRequirements.RemoveAll(x =>
                        x.RequirementName == c.RequirementName && x.CompletedRequirementId == c.CompletedRequirementId),
                },
                ExemptVolunteerRequirement c => volunteerEntry with
                {
                    ExemptedRequirements = volunteerEntry.ExemptedRequirements.Add(
                        new ExemptedRequirementInfo(userId, timestampUtc, c.RequirementName, DueDate: null,
                            c.AdditionalComments, c.ExemptionExpiresAtUtc))
                },
                UnexemptVolunteerRequirement c => volunteerEntry with
                {
                    ExemptedRequirements = volunteerEntry.ExemptedRequirements.RemoveAll(x =>
                        x.RequirementName == c.RequirementName)
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
