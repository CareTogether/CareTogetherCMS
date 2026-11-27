using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CareTogether.Resources.V1Cases
{
    internal sealed record ArrangementMonitoringHistory(
        Guid ArrangementId,
        Guid CreationId,
        Guid? LifecycleChangeId,
        ImmutableDictionary<string, Guid?> EvidenceChangeIds
    )
    {
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
