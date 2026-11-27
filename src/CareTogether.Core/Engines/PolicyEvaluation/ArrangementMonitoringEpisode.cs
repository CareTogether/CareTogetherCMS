using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Azure;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal sealed record ArrangementMonitoringOccurrence(
        Guid ArrangementId,
        Guid ArrangementCreationId,
        Guid RuleId,
        string Schedule,
        DateOnly ScheduleStart,
        DateOnly DueDate
    );

    internal sealed record ArrangementMonitoringEpisode(
        ArrangementMonitoringOccurrence Occurrence,
        Guid LifecycleChangeId,
        Guid? EvidenceChangeId,
        ETag? PolicyRevision
    )
    {
        internal static ImmutableList<Func<DateOnly, ArrangementMonitoringEpisode>?> ForRules(
            ArrangementPolicy arrangementPolicy,
            ArrangementEntry arrangement,
            ETag? policyRevision
        )
        {
            var rules = arrangementPolicy.RequiredMonitoringActions_PRE_MIGRATION;
            if (arrangement.MonitoringHistory is null)
                return rules
                    .Select(_ => (Func<DateOnly, ArrangementMonitoringEpisode>?)null)
                    .ToImmutableList();

            var ruleIds = rules.Select(rule => RuleIdentity(arrangementPolicy, rule)).ToList();
            return rules
                .Select(
                    (rule, index) =>
                        ruleIds[index] is Guid ruleId && ruleIds.Count(id => id == ruleId) == 1
                            ? ForRule(arrangement, rule, ruleId, policyRevision)
                            : null
                )
                .ToImmutableList();
        }

        internal static Guid? RuleIdentity(
            ArrangementPolicy arrangementPolicy,
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
                _ => null,
            };
            if (
                canonicalRecurrence is null
                || arrangementPolicy.RequiredMonitoringActions_PRE_MIGRATION.Count(other =>
                    other.Action.ActionName == action
                ) != 1
            )
                return null;

            var digest = SHA256.HashData(
                Encoding.UTF8.GetBytes(
                    JsonSerializer.Serialize(
                        new object?[]
                        {
                            "legacy-monitoring-rule",
                            arrangementPolicy.ArrangementType,
                            action,
                            rule.Action.IsRequired,
                            canonicalRecurrence,
                        }
                    )
                )
            );
            return new Guid(digest.AsSpan(0, 16));
        }

        internal static Func<DateOnly, ArrangementMonitoringEpisode>? ForRule(
            ArrangementEntry arrangement,
            MonitoringRequirement rule,
            Guid ruleId,
            ETag? policyRevision
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
            var hasEvidenceChange = history.EvidenceChangeIds.TryGetValue(action, out var evidence);
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
                _ => null,
            };
            if (schedule is null)
                return null;

            return dueDate =>
                new(
                    new(
                        history.ArrangementId,
                        history.CreationId,
                        ruleId,
                        schedule,
                        start,
                        dueDate
                    ),
                    lifecycle,
                    evidence,
                    policyRevision
                );
        }
    }
}
