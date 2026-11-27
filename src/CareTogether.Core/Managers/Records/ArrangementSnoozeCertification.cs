using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.OrganizationApprovals;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Managers.Records
{
    internal sealed record ApprovalStreams(
        ApprovalsResource? Approvals,
        DirectoryResource? Directory,
        OrganizationApprovalsResource? OrganizationApprovals
    )
    {
        internal static ApprovalStreams None { get; } = new(null, null, null);
    }

    internal sealed record ApprovalProvenance(
        EventStreamSnapshot? Approvals,
        EventStreamSnapshot? Directory,
        EventStreamSnapshot? OrganizationApprovals
    )
    {
        internal static ApprovalProvenance None { get; } = new(null, null, null);
    }

    internal static class ArrangementSnoozeCertification
    {
        internal static Task<ImmutableList<RecordsAggregate>> CertifyAsync(
            V1CasesResource cases,
            PoliciesResource policies,
            Guid organizationId,
            Guid locationId,
            Func<Task<ImmutableList<RecordsAggregate>>> render
        ) =>
            CertifyAsync(cases, policies, ApprovalStreams.None, organizationId, locationId, render);

        internal static async Task<ImmutableList<RecordsAggregate>> CertifyAsync(
            V1CasesResource cases,
            PoliciesResource policies,
            ApprovalStreams streams,
            Guid organizationId,
            Guid locationId,
            Func<Task<ImmutableList<RecordsAggregate>>> render
        )
        {
            var positionTask = cases.GetReplayPositionAsync(organizationId, locationId);
            var configurationTask = policies.ConfigurationRevisionAsync(
                organizationId,
                revalidate: false
            );
            var approvalsTask = streams.Approvals is { } approvalsResource
                ? approvalsResource.CaptureStreamAsync(organizationId, locationId)
                : Task.FromResult<EventStreamSnapshot?>(null);
            var directoryTask = streams.Directory is { } directoryResource
                ? directoryResource.CaptureStreamAsync(organizationId, locationId)
                : Task.FromResult<EventStreamSnapshot?>(null);
            var organizationApprovalsTask = streams.OrganizationApprovals
                is { } organizationResource
                ? organizationResource.CaptureStreamAsync(organizationId, locationId)
                : Task.FromResult<EventStreamSnapshot?>(null);
            await Task.WhenAll(
                positionTask,
                configurationTask,
                approvalsTask,
                directoryTask,
                organizationApprovalsTask
            );
            var position = await positionTask;
            var configuration = await configurationTask;
            var approvals = await approvalsTask;
            var directory = await directoryTask;
            var organizationApprovals = await organizationApprovalsTask;
            var aggregates = await render();
            if (
                position is null
                || configuration is not ETag capturedConfiguration
                || !aggregates.Any(aggregate =>
                    aggregate is FamilyRecordsAggregate or CommunityRecordsAggregate
                )
            )
                return aggregates;

            var referralsRevision = await cases.VerifyReplayPositionAsync(
                organizationId,
                locationId,
                position
            );
            if (referralsRevision is not long revision)
                return aggregates;

            if (
                await policies.ValidatePolicyRevisionAsync(organizationId, locationId)
                    is not ETag policyRevision
                || await policies.ConfigurationRevisionAsync(organizationId, revalidate: true)
                    != capturedConfiguration
            )
                return aggregates;

            var familyApprovalsVerified =
                approvals is not null
                && directory is not null
                && await streams.Approvals!.VerifyStreamAsync(organizationId, locationId, approvals)
                && await streams.Directory!.VerifyStreamAsync(
                    organizationId,
                    locationId,
                    directory
                );
            var organizationApprovalsVerified =
                organizationApprovals is not null
                && await streams.OrganizationApprovals!.VerifyStreamAsync(
                    organizationId,
                    locationId,
                    organizationApprovals
                );

            return Certify(
                aggregates,
                revision,
                policyRevision,
                new ApprovalProvenance(
                    familyApprovalsVerified ? approvals : null,
                    familyApprovalsVerified ? directory : null,
                    organizationApprovalsVerified ? organizationApprovals : null
                ),
                capturedConfiguration
            );
        }

        internal static ImmutableList<RecordsAggregate> Certify(
            ImmutableList<RecordsAggregate> aggregates,
            long referralsRevision,
            ETag policyRevision
        ) => Certify(aggregates, referralsRevision, policyRevision, ApprovalProvenance.None, null);

        internal static ImmutableList<RecordsAggregate> Certify(
            ImmutableList<RecordsAggregate> aggregates,
            long referralsRevision,
            ETag policyRevision,
            ApprovalProvenance provenance,
            ETag? configurationRevision
        )
        {
            var freshness = new RequirementSnoozeFreshness(
                referralsRevision,
                Digest(["policy", policyRevision.ToString()])
            );
            return aggregates
                .Select(aggregate =>
                    aggregate switch
                    {
                        FamilyRecordsAggregate family
                            when family.Family.VolunteerFamilyInfo is not null
                                && provenance
                                    is { Approvals: { } approvals, Directory: { } directory } =>
                            family with
                            {
                                Family = ApprovalSnoozeTokens.ForFamily(
                                    Certify(family.Family, policyRevision, configurationRevision),
                                    approvals,
                                    directory,
                                    policyRevision,
                                    configurationRevision
                                ),
                                SnoozeFreshness = freshness with
                                {
                                    ApprovalsRevision = approvals.Position.EventCount,
                                    DirectoryRevision = directory.Position.EventCount,
                                },
                            },
                        FamilyRecordsAggregate family => family with
                        {
                            Family = Certify(family.Family, policyRevision, configurationRevision),
                            SnoozeFreshness = freshness,
                        },
                        CommunityRecordsAggregate community
                            when community.Community.ApprovalInfo is not null
                                && provenance.OrganizationApprovals is { } organizationApprovals =>
                            community with
                            {
                                Community = ApprovalSnoozeTokens.ForCommunity(
                                    community.Community,
                                    organizationApprovals,
                                    policyRevision,
                                    configurationRevision
                                ),
                                SnoozeFreshness = freshness with
                                {
                                    OrganizationApprovalsRevision = organizationApprovals
                                        .Position
                                        .EventCount,
                                },
                            },
                        _ => aggregate,
                    }
                )
                .ToImmutableList();
        }

        internal static string? Token(
            ArrangementMonitoringEpisode episode,
            ETag policyRevision,
            ETag? configurationRevision = null
        )
        {
            if (episode.PolicyRevision != policyRevision)
                return null;

            var occurrence = episode.Occurrence;
            string?[] parts =
            [
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
            ];
            string?[] occurrenceScope =
                occurrence.AssignmentLifetimeId is null && occurrence.ChildcareProvenance is null
                    ? []
                    : [occurrence.AssignmentLifetimeId?.ToString(), occurrence.ChildcareProvenance];
            string?[] configurationScope = configurationRevision is ETag configuration
                ? ["configuration", configuration.ToString()]
                : [];
            return Digest([.. parts, .. occurrenceScope, .. configurationScope]);
        }

        private static CombinedFamilyInfo Certify(
            CombinedFamilyInfo family,
            ETag policyRevision,
            ETag? configurationRevision
        ) =>
            family.PartneringFamilyInfo is not { } partnering
                ? family
                : family with
                {
                    PartneringFamilyInfo = partnering with
                    {
                        OpenV1Case = partnering.OpenV1Case is { } open
                            ? Certify(open, policyRevision, configurationRevision)
                            : null,
                        ClosedV1Cases = partnering
                            .ClosedV1Cases.Select(closed =>
                                Certify(closed, policyRevision, configurationRevision)
                            )
                            .ToImmutableList(),
                    },
                };

        private static V1Case Certify(
            V1Case v1Case,
            ETag policyRevision,
            ETag? configurationRevision
        ) =>
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
                                            ? Token(episode, policyRevision, configurationRevision)
                                            : null,
                                    }
                                )
                                .ToImmutableList(),
                        }
                    )
                    .ToImmutableList(),
            };

        internal static string Digest(string?[] parts) =>
            Convert
                .ToBase64String(
                    SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(parts)))
                )
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
    }
}
