using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Azure;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal sealed record ArrangementMonitoringOccurrence(
        Guid ArrangementId,
        Guid ArrangementCreationId,
        Guid RuleId,
        string Schedule,
        DateOnly ScheduleStart,
        DateOnly DueDate
    )
    {
        internal Guid? AssignmentLifetimeId { get; init; }
        internal string? ChildcareProvenance { get; init; }
    }

    internal sealed record ArrangementMonitoringEpisode(
        ArrangementMonitoringOccurrence Occurrence,
        Guid LifecycleChangeId,
        Guid? EvidenceChangeId,
        ETag? PolicyRevision
    )
    {
        private sealed record AssignmentScope(VolunteerAssignmentKey Key, Guid LifetimeId);

        internal static ImmutableList<Func<DateOnly, ArrangementMonitoringEpisode>?> ForRules(
            ArrangementPolicy arrangementPolicy,
            ArrangementEntry arrangement,
            ETag? policyRevision
        ) =>
            ForRules(
                arrangementPolicy.RequiredMonitoringActions_PRE_MIGRATION,
                [arrangementPolicy.ArrangementType],
                arrangement,
                policyRevision,
                null
            );

        internal static ImmutableList<Func<
            DateOnly,
            ArrangementMonitoringEpisode
        >?> ForAssignmentRules(
            ArrangementPolicy arrangementPolicy,
            string functionName,
            ArrangementFunctionVariant variant,
            ArrangementEntry arrangement,
            VolunteerAssignmentKey assignment,
            ETag? policyRevision
        )
        {
            var rules = variant.RequiredMonitoringActions_PRE_MIGRATION;
            var matchingAssignments =
                arrangement.FamilyVolunteerAssignments.Count(candidate =>
                    assignment
                    == new VolunteerAssignmentKey(
                        candidate.FamilyId,
                        null,
                        candidate.ArrangementFunction,
                        candidate.ArrangementFunctionVariant
                    )
                )
                + arrangement.IndividualVolunteerAssignments.Count(candidate =>
                    assignment
                    == new VolunteerAssignmentKey(
                        candidate.FamilyId,
                        candidate.PersonId,
                        candidate.ArrangementFunction,
                        candidate.ArrangementFunctionVariant
                    )
                );
            if (
                matchingAssignments != 1
                || arrangement.MonitoringHistory is not { } history
                || !history.AssignmentLifetimeIds.TryGetValue(assignment, out var lifetime)
                || lifetime is not Guid lifetimeId
                || lifetimeId == Guid.Empty
            )
                return [.. rules.Select(_ => (Func<DateOnly, ArrangementMonitoringEpisode>?)null)];

            return ForRules(
                rules,
                [arrangementPolicy.ArrangementType, functionName, variant.VariantName],
                arrangement,
                policyRevision,
                new AssignmentScope(assignment, lifetimeId)
            );
        }

        private static ImmutableList<Func<DateOnly, ArrangementMonitoringEpisode>?> ForRules(
            ImmutableList<MonitoringRequirement> rules,
            string?[] ruleScope,
            ArrangementEntry arrangement,
            ETag? policyRevision,
            AssignmentScope? assignment
        )
        {
            if (arrangement.MonitoringHistory is null)
                return [.. rules.Select(_ => (Func<DateOnly, ArrangementMonitoringEpisode>?)null)];

            var ruleIds = rules.Select(rule => RuleIdentity(ruleScope, rules, rule)).ToList();
            return
            [
                .. rules.Select(
                    (rule, index) =>
                        ruleIds[index] is Guid ruleId && ruleIds.Count(id => id == ruleId) == 1
                            ? ForRule(arrangement, rule, ruleId, policyRevision, assignment)
                            : null
                ),
            ];
        }

        internal static Guid? RuleIdentity(
            ArrangementPolicy arrangementPolicy,
            MonitoringRequirement rule
        ) =>
            RuleIdentity(
                [arrangementPolicy.ArrangementType],
                arrangementPolicy.RequiredMonitoringActions_PRE_MIGRATION,
                rule
            );

        private static Guid? RuleIdentity(
            string?[] ruleScope,
            ImmutableList<MonitoringRequirement> siblings,
            MonitoringRequirement rule
        )
        {
            if (rule.Id is Guid persisted)
                return persisted == Guid.Empty ? null : persisted;

            var action = rule.Action.ActionName;
            var canonicalRecurrence = rule.Recurrence switch
            {
                OneTimeRecurrencePolicy oneTime => JsonSerializer.Serialize(
                    new object?[] { "once", oneTime.Delay?.Ticks }
                ),
                DurationStagesRecurrencePolicy stages => JsonSerializer.Serialize(
                    new object?[]
                    {
                        "duration",
                        stages.Stages.Select(stage =>
                            new object?[] { stage.Delay.Ticks, stage.MaxOccurrences }
                        ),
                    }
                ),
                DurationStagesPerChildLocationRecurrencePolicy stages => JsonSerializer.Serialize(
                    new object?[]
                    {
                        "duration-per-child-location",
                        stages.Stages.Select(stage =>
                            new object?[] { stage.Delay.Ticks, stage.MaxOccurrences }
                        ),
                    }
                ),
                ChildCareOccurrenceBasedRecurrencePolicy childCare => JsonSerializer.Serialize(
                    new object?[]
                    {
                        "childcare",
                        childCare.Delay.Ticks,
                        childCare.Frequency,
                        childCare.InitialSkipCount,
                        childCare.Positive,
                    }
                ),
                _ => null,
            };
            if (
                canonicalRecurrence is null
                || siblings.Count(other => other.Action.ActionName == action) != 1
            )
                return null;

            var digest = SHA256.HashData(
                Encoding.UTF8.GetBytes(
                    JsonSerializer.Serialize(
                        new object?[] { "legacy-monitoring-rule" }
                            .Concat(ruleScope)
                            .Concat([action, rule.Action.IsRequired, canonicalRecurrence])
                            .ToArray()
                    )
                )
            );
            return new Guid(digest.AsSpan(0, 16));
        }

        private static Func<DateOnly, ArrangementMonitoringEpisode>? ForRule(
            ArrangementEntry arrangement,
            MonitoringRequirement rule,
            Guid ruleId,
            ETag? policyRevision,
            AssignmentScope? assignment
        )
        {
            if (
                !rule.Action.IsRequired
                || ruleId == Guid.Empty
                || arrangement.StartedAt is not DateOnly start
                || arrangement.MonitoringHistory
                    is not { LifecycleChangeId: Guid lifecycle } history
                || lifecycle == Guid.Empty
            )
                return null;

            var action = rule.Action.ActionName;
            var hasEvidenceChange = assignment is null
                ? history.EvidenceChangeIds.TryGetValue(action, out var evidence)
                : history.AssignmentEvidenceChangeIds.TryGetValue(
                    (assignment.Key, action),
                    out evidence
                );
            if (hasEvidenceChange && (evidence is null || evidence == Guid.Empty))
                return null;

            var schedule = rule.Recurrence switch
            {
                OneTimeRecurrencePolicy oneTime => JsonSerializer.Serialize(
                    new
                    {
                        Kind = "once",
                        Action = action,
                        Delay = oneTime.Delay?.Days,
                    }
                ),
                DurationStagesRecurrencePolicy stages => JsonSerializer.Serialize(
                    new
                    {
                        Kind = "duration",
                        Action = action,
                        Stages = stages.Stages.Select(s => new
                        {
                            Delay = s.Delay.Ticks,
                            s.MaxOccurrences,
                        }),
                    }
                ),
                DurationStagesPerChildLocationRecurrencePolicy stages => JsonSerializer.Serialize(
                    new
                    {
                        Kind = "duration-per-child-location",
                        Action = action,
                        Stages = stages.Stages.Select(s => new
                        {
                            Delay = s.Delay.Ticks,
                            s.MaxOccurrences,
                        }),
                    }
                ),
                ChildCareOccurrenceBasedRecurrencePolicy childCare => JsonSerializer.Serialize(
                    new
                    {
                        Kind = "childcare",
                        Action = action,
                        Delay = childCare.Delay.Ticks,
                        childCare.Frequency,
                        childCare.InitialSkipCount,
                        childCare.Positive,
                    }
                ),
                _ => null,
            };
            if (schedule is null)
                return null;

            var childLocationFamilyId = assignment?.Key.VolunteerFamilyId;
            return dueDate =>
                new(
                    new(history.ArrangementId, history.CreationId, ruleId, schedule, start, dueDate)
                    {
                        AssignmentLifetimeId = assignment?.LifetimeId,
                        ChildcareProvenance = ChildcareProvenance(
                            rule.Recurrence,
                            arrangement,
                            childLocationFamilyId,
                            dueDate
                        ),
                    },
                    lifecycle,
                    evidence,
                    policyRevision
                );
        }

        private static string? ChildcareProvenance(
            RecurrencePolicy recurrence,
            ArrangementEntry arrangement,
            Guid? childLocationFamilyId,
            DateOnly dueDate
        )
        {
            switch (recurrence)
            {
                case DurationStagesPerChildLocationRecurrencePolicy:
                    var timeline = V1CaseCalculations.CreateChildLocationBasedTimeline(
                        arrangement.ChildLocationHistory,
                        childLocationFamilyId
                    );
                    var ranges =
                        timeline is null || dueDate < timeline.Start
                            ? []
                            : timeline
                                .IntersectionWith(new DateRange(timeline.Start, dueDate))
                                ?.Ranges.Select(range =>
                                    new[] { range.Start.ToString("O"), range.End.ToString("O") }
                                )
                                ?? [];
                    return JsonSerializer.Serialize(new object[] { "timeline", ranges });
                case ChildCareOccurrenceBasedRecurrencePolicy childCare:
                    var occurrenceDate = dueDate.AddDays(-childCare.Delay.Days);
                    return JsonSerializer.Serialize(
                        new object[]
                        {
                            "occurrences",
                            arrangement
                                .ChildLocationHistory.Where(location =>
                                    !location.Paused
                                    && (
                                        childLocationFamilyId is null
                                        || location.ChildLocationFamilyId == childLocationFamilyId
                                    )
                                    && location.Date <= occurrenceDate
                                )
                                .Select(location =>
                                    new[]
                                    {
                                        location.ChildLocationFamilyId.ToString(),
                                        location.Date.ToString("O"),
                                    }
                                ),
                        }
                    );
                default:
                    return null;
            }
        }
    }
}
