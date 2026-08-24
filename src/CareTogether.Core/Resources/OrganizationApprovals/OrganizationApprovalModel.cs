using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Approvals;
using JsonPolymorph;

namespace CareTogether.Resources.OrganizationApprovals
{
    [JsonHierarchyBase]
    public abstract partial record OrganizationApprovalEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);

    public sealed record OrganizationApprovalCommandExecuted(
        Guid UserId,
        DateTime TimestampUtc,
        OrganizationApprovalCommand Command
    ) : OrganizationApprovalEvent(UserId, TimestampUtc);

    public sealed class OrganizationApprovalModel
    {
        private ImmutableDictionary<Guid, OrganizationApprovalEntry> entries =
            ImmutableDictionary<Guid, OrganizationApprovalEntry>.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<OrganizationApprovalModel> InitializeAsync(
            IAsyncEnumerable<(OrganizationApprovalEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            var model = new OrganizationApprovalModel();
            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);
            return model;
        }

        public (
            OrganizationApprovalCommandExecuted Event,
            long SequenceNumber,
            OrganizationApprovalEntry Entry,
            Action OnCommit
        ) ExecuteCommand(
            OrganizationApprovalCommand command,
            Guid userId,
            DateTime timestampUtc
        )
        {
            var current = entries.GetValueOrDefault(command.OrganizationId) ?? EmptyEntry(
                command.OrganizationId
            );
            var updated = command switch
            {
                ActivateOrganizationApprovals => current,
                CompleteOrganizationRequirement c => current with
                {
                    CompletedRequirements = current.CompletedRequirements.Add(
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
                MarkOrganizationRequirementIncomplete c => current with
                {
                    CompletedRequirements = current.CompletedRequirements.RemoveAll(item =>
                        item.CompletedRequirementId == c.CompletedRequirementId
                        && item.RequirementName == c.RequirementName
                    ),
                },
                ExemptOrganizationRequirement c => current with
                {
                    ExemptedRequirements = current.ExemptedRequirements.Add(
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
                UnexemptOrganizationRequirement c => current with
                {
                    ExemptedRequirements = current.ExemptedRequirements.RemoveAll(item =>
                        item.RequirementName == c.RequirementName
                    ),
                },
                RemoveOrganizationRole c => current with
                {
                    RoleRemovals = current.RoleRemovals.Add(
                        new RoleRemoval(
                            c.RoleName,
                            c.Reason,
                            c.EffectiveSince ?? DateOnly.FromDateTime(timestampUtc),
                            c.EffectiveThrough,
                            c.AdditionalComments
                        )
                    ),
                },
                ResetOrganizationRole c => current with
                {
                    RoleRemovals = ResetRole(current.RoleRemovals, c, timestampUtc),
                },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

            return (
                new OrganizationApprovalCommandExecuted(userId, timestampUtc, command),
                LastKnownSequenceNumber + 1,
                updated,
                () =>
                {
                    LastKnownSequenceNumber++;
                    entries = entries.SetItem(updated.OrganizationId, updated);
                }
            );
        }

        public ImmutableList<OrganizationApprovalEntry> List() => entries.Values.ToImmutableList();

        public OrganizationApprovalEntry? TryGet(Guid organizationId) =>
            entries.GetValueOrDefault(organizationId);

        private static OrganizationApprovalEntry EmptyEntry(Guid organizationId) =>
            new(
                organizationId,
                ImmutableList<CompletedRequirementInfo>.Empty,
                ImmutableList<ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty
            );

        private static ImmutableList<RoleRemoval> ResetRole(
            ImmutableList<RoleRemoval> removals,
            ResetOrganizationRole command,
            DateTime timestampUtc
        )
        {
            var today = DateOnly.FromDateTime(timestampUtc);
            return removals
                .UpdateAll(
                    removal =>
                        removal.RoleName == command.RoleName
                        && removal.EffectiveUntil == null
                        && (
                            command.ForRemovalEffectiveSince == null
                            || removal.EffectiveSince == command.ForRemovalEffectiveSince
                        )
                        && removal.EffectiveSince <= today,
                    removal => removal with
                    {
                        EffectiveUntil = command.EffectiveThrough ?? today.AddDays(-1),
                    }
                )
                .RemoveAll(removal =>
                    removal.RoleName == command.RoleName
                    && removal.EffectiveUntil <= removal.EffectiveSince
                );
        }

        private void ReplayEvent(OrganizationApprovalEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is not OrganizationApprovalCommandExecuted commandExecuted)
                throw new NotImplementedException(
                    $"The event type '{domainEvent.GetType().FullName}' has not been implemented."
                );

            var (_, _, _, onCommit) = ExecuteCommand(
                commandExecuted.Command,
                commandExecuted.UserId,
                commandExecuted.TimestampUtc
            );
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
