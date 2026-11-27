using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CareTogether.Resources.V1Cases
{
    internal sealed record VolunteerAssignmentKey(
        Guid VolunteerFamilyId,
        Guid? PersonId,
        string ArrangementFunction,
        string? ArrangementFunctionVariant
    );

    internal sealed record ArrangementMonitoringHistory(
        Guid ArrangementId,
        Guid CreationId,
        Guid? LifecycleChangeId,
        ImmutableDictionary<string, Guid?> EvidenceChangeIds
    )
    {
        internal ImmutableDictionary<
            VolunteerAssignmentKey,
            Guid?
        > AssignmentLifetimeIds { get; init; } =
            ImmutableDictionary<VolunteerAssignmentKey, Guid?>.Empty;

        internal ImmutableDictionary<
            (VolunteerAssignmentKey Assignment, string Action),
            Guid?
        > AssignmentEvidenceChangeIds { get; init; } =
            ImmutableDictionary<(VolunteerAssignmentKey, string), Guid?>.Empty;

        private static ILookup<
            VolunteerAssignmentKey,
            (
                ImmutableList<CompletedRequirementInfo> Completed,
                ImmutableList<ExemptedRequirementInfo> Exempted
            )
        > Assignments(ArrangementEntry arrangement) =>
            arrangement
                .FamilyVolunteerAssignments.Select(assignment =>
                    (
                        Key: new VolunteerAssignmentKey(
                            assignment.FamilyId,
                            null,
                            assignment.ArrangementFunction,
                            assignment.ArrangementFunctionVariant
                        ),
                        Evidence: (
                            assignment.CompletedRequirements,
                            assignment.ExemptedRequirements
                        )
                    )
                )
                .Concat(
                    arrangement.IndividualVolunteerAssignments.Select(assignment =>
                        (
                            Key: new VolunteerAssignmentKey(
                                assignment.FamilyId,
                                assignment.PersonId,
                                assignment.ArrangementFunction,
                                assignment.ArrangementFunctionVariant
                            ),
                            Evidence: (
                                assignment.CompletedRequirements,
                                assignment.ExemptedRequirements
                            )
                        )
                    )
                )
                .ToLookup(entry => entry.Key, entry => entry.Evidence);

        private static string? AssignmentAction(ArrangementsCommand command) =>
            command switch
            {
                CompleteVolunteerFamilyAssignmentRequirement c => c.RequirementName,
                MarkVolunteerFamilyAssignmentRequirementIncomplete c => c.RequirementName,
                ExemptVolunteerFamilyAssignmentRequirement c => c.RequirementName,
                UnexemptVolunteerFamilyAssignmentRequirement c => c.RequirementName,
                CompleteIndividualVolunteerAssignmentRequirement c => c.RequirementName,
                MarkIndividualVolunteerAssignmentRequirementIncomplete c => c.RequirementName,
                ExemptIndividualVolunteerAssignmentRequirement c => c.RequirementName,
                UnexemptIndividualVolunteerAssignmentRequirement c => c.RequirementName,
                _ => null,
            };

        private static ArrangementMonitoringHistory ApplyAssignments(
            ArrangementMonitoringHistory history,
            ArrangementEntry previous,
            ArrangementEntry next,
            ArrangementsCommand command,
            Guid? changeId
        )
        {
            var before = Assignments(previous);
            var after = Assignments(next);
            var lifetimes = history.AssignmentLifetimeIds;
            var evidence = history.AssignmentEvidenceChangeIds;

            foreach (
                var ended in before.Select(group => group.Key).Where(key => !after.Contains(key))
            )
            {
                lifetimes = lifetimes.Remove(ended);
                evidence = evidence.RemoveRange(
                    evidence.Keys.Where(entry => entry.Assignment == ended)
                );
            }

            foreach (var group in after)
                if (!before.Contains(group.Key))
                {
                    lifetimes = lifetimes.SetItem(group.Key, group.Count() == 1 ? changeId : null);
                    evidence = evidence.RemoveRange(
                        evidence.Keys.Where(entry => entry.Assignment == group.Key)
                    );
                }
                else if (group.Count() != 1 || before[group.Key].Count() != 1)
                    lifetimes = lifetimes.SetItem(group.Key, null);

            var action = AssignmentAction(command);
            foreach (
                var changed in after
                    .Select(group => group.Key)
                    .Where(key =>
                        before.Contains(key)
                        && !before[key]
                            .Zip(after[key])
                            .All(pair =>
                                pair.First.Completed.SequenceEqual(pair.Second.Completed)
                                && pair.First.Exempted.SequenceEqual(pair.Second.Exempted)
                            )
                    )
            )
                if (action is not null)
                    evidence = evidence.SetItem((changed, action), changeId);
                else if (lifetimes.TryGetValue(changed, out var lifetime) && lifetime is not null)
                    lifetimes = lifetimes.SetItem(changed, changeId);

            return history with
            {
                AssignmentLifetimeIds = lifetimes,
                AssignmentEvidenceChangeIds = evidence,
            };
        }

        internal static Guid LegacyChangeId(
            (Guid OrganizationId, Guid LocationId) stream,
            long sequenceNumber,
            ArrangementsCommandExecuted executed
        )
        {
            var digest = SHA256.HashData(
                Encoding.UTF8.GetBytes(
                    JsonSerializer.Serialize(
                        new object[]
                        {
                            "legacy-arrangement-event",
                            "ReferralsEventLog",
                            stream.OrganizationId,
                            stream.LocationId,
                            sequenceNumber,
                            executed.UserId,
                            executed.TimestampUtc.Ticks,
                        }
                    )
                )
            );
            return new Guid(digest.AsSpan(0, 16));
        }

        internal static ArrangementMonitoringHistory? Apply(
            ArrangementEntry? previous,
            ArrangementEntry next,
            ArrangementsCommandExecuted executed
        )
        {
            var changeId = executed.MonitoringChangeId;
            if (executed.Command is CreateArrangement)
                return changeId is Guid created && created != Guid.Empty
                    ? new(next.Id, created, created, ImmutableDictionary<string, Guid?>.Empty)
                    : null;

            if (previous?.MonitoringHistory is not { } history)
                return null;

            if (
                previous.Active != next.Active
                || previous.StartedAtUtc != next.StartedAtUtc
                || previous.EndedAtUtc != next.EndedAtUtc
                || previous.CancelledAtUtc != next.CancelledAtUtc
                || previous.ArrangementType != next.ArrangementType
                || previous.ArrangementPolicyVersion != next.ArrangementPolicyVersion
            )
                history = history with { LifecycleChangeId = changeId };

            history = ApplyAssignments(history, previous, next, executed.Command, changeId);

            var action = executed.Command switch
            {
                CompleteArrangementRequirement c => c.RequirementName,
                MarkArrangementRequirementIncomplete c => c.RequirementName,
                ExemptArrangementRequirement c => c.RequirementName,
                UnexemptArrangementRequirement c => c.RequirementName,
                _ => null,
            };
            if (
                action is null
                || (
                    previous.CompletedRequirements.SequenceEqual(next.CompletedRequirements)
                    && previous.ExemptedRequirements.SequenceEqual(next.ExemptedRequirements)
                )
            )
                return history;

            return history with
            {
                EvidenceChangeIds = history.EvidenceChangeIds.SetItem(action, changeId),
            };
        }
    }
}
