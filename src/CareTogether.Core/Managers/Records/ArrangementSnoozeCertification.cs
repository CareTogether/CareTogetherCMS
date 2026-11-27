using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;

namespace CareTogether.Managers.Records
{
    internal static class ArrangementSnoozeCertification
    {
        internal static async Task<ImmutableList<RecordsAggregate>> CertifyAsync(
            V1CasesResource cases,
            PoliciesResource policies,
            Guid organizationId,
            Guid locationId,
            Func<Task<ImmutableList<RecordsAggregate>>> render
        )
        {
            var position = await cases.GetReplayPositionAsync(organizationId, locationId);
            var aggregates = await render();
            if (position is null)
                return aggregates;

            var referralsRevision = await cases.VerifyReplayPositionAsync(
                organizationId,
                locationId,
                position
            );
            if (referralsRevision is not long revision)
                return aggregates;

            return
                await policies.ValidatePolicyRevisionAsync(organizationId, locationId)
                    is ETag policyRevision
                ? Certify(aggregates, revision, policyRevision)
                : aggregates;
        }

        internal static ImmutableList<RecordsAggregate> Certify(
            ImmutableList<RecordsAggregate> aggregates,
            long referralsRevision,
            ETag policyRevision
        )
        {
            var freshness = new RequirementSnoozeFreshness(
                referralsRevision,
                Digest(["policy", policyRevision.ToString()])
            );
            return aggregates
                .Select(aggregate =>
                    aggregate is FamilyRecordsAggregate family
                        ? family with
                        {
                            Family = Certify(family.Family, policyRevision),
                            SnoozeFreshness = freshness,
                        }
                        : aggregate
                )
                .ToImmutableList();
        }

        internal static string? Token(ArrangementMonitoringEpisode episode, ETag policyRevision)
        {
            if (episode.PolicyRevision != policyRevision)
                return null;

            var occurrence = episode.Occurrence;
            return Digest([
                "arrangement-monitoring",
                occurrence.ArrangementId.ToString(),
                occurrence.ArrangementCreationId.ToString(),
                occurrence.RuleId.ToString(),
                occurrence.Schedule,
                occurrence.ScheduleStart.ToString("O"),
                occurrence.DueDate.ToString("O"),
                episode.LifecycleChangeId.ToString(),
                episode.EvidenceChangeId?.ToString(),
                policyRevision.ToString(),
            ]);
        }

        private static CombinedFamilyInfo Certify(CombinedFamilyInfo family, ETag policyRevision) =>
            family.PartneringFamilyInfo is not { } partnering
                ? family
                : family with
                {
                    PartneringFamilyInfo = partnering with
                    {
                        OpenV1Case = partnering.OpenV1Case is { } open
                            ? Certify(open, policyRevision)
                            : null,
                        ClosedV1Cases = partnering
                            .ClosedV1Cases.Select(closed => Certify(closed, policyRevision))
                            .ToImmutableList(),
                    },
                };

        private static V1Case Certify(V1Case v1Case, ETag policyRevision) =>
            v1Case with
            {
                Arrangements = v1Case
                    .Arrangements.Select(arrangement =>
                        arrangement with
                        {
                            MissingRequirements = arrangement
                                .MissingRequirements.Select(requirement =>
                                    requirement with
                                    {
                                        SnoozeEpisodeToken = requirement.MonitoringEpisode
                                            is { } episode
                                            ? Token(episode, policyRevision)
                                            : null,
                                    }
                                )
                                .ToImmutableList(),
                        }
                    )
                    .ToImmutableList(),
            };

        private static string Digest(string?[] parts) =>
            Convert
                .ToBase64String(
                    SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(parts)))
                )
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
    }
}
