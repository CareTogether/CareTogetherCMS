using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Azure;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Managers.Records
{
    internal static class ApprovalSnoozeTokens
    {
        internal static CombinedFamilyInfo ForFamily(
            CombinedFamilyInfo family,
            EventStreamSnapshot approvals,
            EventStreamSnapshot directory,
            ETag policyRevision,
            ETag? configurationRevision
        )
        {
            if (family.VolunteerFamilyInfo is not { } volunteerFamily)
                return family;

            var familyId = family.Family.Id;
            var directoryState = ArrangementSnoozeCertification.Digest([
                "approval-directory",
                (
                    directory.SubjectRevisions.TryGetValue(familyId, out var directoryRevision)
                        ? directoryRevision
                        : 0
                ).ToString(),
                family.Family.Active.ToString(),
                .. family
                    .Family.Adults.Select(adult => $"{adult.Item1.Id}:{adult.Item1.Active}")
                    .Order(StringComparer.Ordinal),
            ]);
            var provenance = Provenance(
                approvals.SubjectRevisions.TryGetValue(familyId, out var revision) ? revision : 0,
                directoryState,
                policyRevision,
                configurationRevision
            );

            return family with
            {
                VolunteerFamilyInfo = volunteerFamily with
                {
                    FamilyRoleApprovals = volunteerFamily.FamilyRoleApprovals.ToImmutableDictionary(
                        role => role.Key,
                        role =>
                            role.Value with
                            {
                                SnoozeEpisodeToken = provenance([
                                    "family-role",
                                    familyId.ToString(),
                                    role.Key,
                                ]),
                            }
                    ),
                    IndividualVolunteers =
                        volunteerFamily.IndividualVolunteers.ToImmutableDictionary(
                            person => person.Key,
                            person =>
                                person.Value with
                                {
                                    ApprovalStatusByRole =
                                        person.Value.ApprovalStatusByRole.ToImmutableDictionary(
                                            role => role.Key,
                                            role =>
                                                role.Value with
                                                {
                                                    SnoozeEpisodeToken = provenance([
                                                        "individual-role",
                                                        familyId.ToString(),
                                                        person.Key.ToString(),
                                                        role.Key,
                                                    ]),
                                                }
                                        ),
                                }
                        ),
                    RenewalCandidates = Renewals(volunteerFamily.RenewalCandidates, provenance),
                },
            };
        }

        internal static CommunityInfo ForCommunity(
            CommunityInfo community,
            EventStreamSnapshot organizationApprovals,
            ETag policyRevision,
            ETag? configurationRevision
        )
        {
            if (community.ApprovalInfo is not { } approvalInfo)
                return community;

            var communityId = community.Community.Id;
            var provenance = Provenance(
                organizationApprovals.SubjectRevisions.TryGetValue(communityId, out var revision)
                    ? revision
                    : 0,
                null,
                policyRevision,
                configurationRevision
            );

            return community with
            {
                ApprovalInfo = approvalInfo with
                {
                    ApprovalStatusByRole = approvalInfo.ApprovalStatusByRole.ToImmutableDictionary(
                        role => role.Key,
                        role =>
                            role.Value with
                            {
                                SnoozeEpisodeToken = provenance([
                                    "organization-role",
                                    communityId.ToString(),
                                    role.Key,
                                ]),
                            }
                    ),
                    RenewalCandidates = Renewals(approvalInfo.RenewalCandidates, provenance),
                },
            };
        }

        private static Func<string?[], string> Provenance(
            long subjectRevision,
            string? directory,
            ETag policyRevision,
            ETag? configurationRevision
        ) =>
            subject =>
                ArrangementSnoozeCertification.Digest([
                    "approval",
                    .. subject,
                    subjectRevision.ToString(),
                    directory,
                    policyRevision.ToString(),
                    configurationRevision?.ToString(),
                ]);

        private static ImmutableList<DisclosedApprovalRenewalCandidate> Renewals(
            ImmutableList<DisclosedApprovalRenewalCandidate> candidates,
            Func<string?[], string> provenance
        )
        {
            var tokens = candidates
                .Select(candidate =>
                    Subject(candidate.Target) is { } subject
                        ? provenance([
                            "renewal",
                            .. subject,
                            candidate.ActionName,
                            candidate.FirstUncoveredOnUtc.ToString("O"),
                        ])
                        : null
                )
                .ToList();
            return candidates
                .Select(
                    (candidate, index) =>
                        tokens[index] is { } token && tokens.Count(other => other == token) == 1
                            ? candidate with
                            {
                                SnoozeEpisodeToken = token,
                            }
                            : candidate
                )
                .ToImmutableList();
        }

        private static IEnumerable<string>? Subject(ApprovalRenewalTarget target) =>
            target switch
            {
                FamilyApprovalRenewalTarget family => ["family", family.FamilyId.ToString()],
                IndividualApprovalRenewalTarget individual =>
                [
                    "individual",
                    individual.FamilyId.ToString(),
                    individual.PersonId.ToString(),
                ],
                OrganizationApprovalRenewalTarget organization =>
                [
                    "organization",
                    organization.CommunityId.ToString(),
                ],
                _ => null,
            };
    }
}
