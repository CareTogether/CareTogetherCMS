using System;
using System.Collections.Immutable;
using System.Linq;
using Azure;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Utilities.EventLog;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ApprovalSnoozeTokenTests
    {
        private static readonly Guid FamilyId = Guid.NewGuid();
        private static readonly Guid OtherFamilyId = Guid.NewGuid();
        private static readonly Guid AdultId = Guid.NewGuid();
        private static readonly Guid SecondAdultId = Guid.NewGuid();
        private static readonly Guid CommunityId = Guid.NewGuid();
        private static readonly ETag Policy = new("\"policy\"");
        private static readonly DateOnly Uncovered = new(2026, 12, 1);
        private static readonly ETag Configuration = new("\"configuration\"");

        private static CombinedFamilyInfo ForFamily(
            CombinedFamilyInfo family,
            EventStreamSnapshot approvals,
            ETag policy,
            EventStreamSnapshot? directory = null,
            ETag? configuration = null
        ) =>
            ApprovalSnoozeTokens.ForFamily(
                family,
                approvals,
                directory ?? Stream(11, (FamilyId, 4)),
                policy,
                configuration ?? Configuration
            );

        private static CommunityInfo ForCommunity(
            CommunityInfo community,
            EventStreamSnapshot organizationApprovals,
            ETag policy
        ) =>
            ApprovalSnoozeTokens.ForCommunity(
                community,
                organizationApprovals,
                policy,
                Configuration
            );

        private static EventStreamSnapshot Stream(
            long count,
            params (Guid Subject, long Revision)[] subjects
        ) =>
            new(
                new EventLogPosition(count, "00001.ndjson", new ETag($"\"{count}\""), count * 10),
                subjects.ToImmutableDictionary(entry => entry.Subject, entry => entry.Revision)
            );

        private static DisclosedApprovalRenewalCandidate Renewal(
            ApprovalRenewalTarget target,
            string action = "Background Check",
            DateOnly? uncovered = null,
            DisclosedApprovalRenewalState state = DisclosedApprovalRenewalState.Upcoming
        ) => new("candidate", target, action, uncovered ?? Uncovered, state, []);

        private static CombinedFamilyInfo Family(
            bool secondAdultActive = true,
            params DisclosedApprovalRenewalCandidate[] renewals
        )
        {
            var info = JsonConvert.DeserializeObject<CombinedFamilyInfo>(
                JsonConvert.SerializeObject(
                    new
                    {
                        Family = new
                        {
                            Id = FamilyId,
                            Active = true,
                            Adults = Array.Empty<object>(),
                        },
                        VolunteerFamilyInfo = new
                        {
                            FamilyRoleApprovals = new { },
                            IndividualVolunteers = new { },
                        },
                    }
                )
            )!;
            Person Adult(Guid id, bool active) =>
                JsonConvert.DeserializeObject<Person>(
                    JsonConvert.SerializeObject(new { Id = id, Active = active })
                )!;
            var volunteer = JsonConvert.DeserializeObject<VolunteerInfo>("{}")! with
            {
                ApprovalStatusByRole = ImmutableDictionary<string, IndividualRoleApprovalStatus>
                    .Empty.Add("Host", new IndividualRoleApprovalStatus(null, []))
                    .Add("Coach", new IndividualRoleApprovalStatus(null, [])),
            };
            return info with
            {
                Family = info.Family with
                {
                    Adults =
                    [
                        (Adult(AdultId, true), null!),
                        (Adult(SecondAdultId, secondAdultActive), null!),
                    ],
                },
                VolunteerFamilyInfo = info.VolunteerFamilyInfo! with
                {
                    FamilyRoleApprovals = ImmutableDictionary<
                        string,
                        FamilyRoleApprovalStatus
                    >.Empty.Add("Host Family", new FamilyRoleApprovalStatus(null, [])),
                    IndividualVolunteers = ImmutableDictionary<Guid, VolunteerInfo>
                        .Empty.Add(AdultId, volunteer)
                        .Add(SecondAdultId, volunteer),
                    RenewalCandidates = [.. renewals],
                },
            };
        }

        private static string?[] Tokens(CombinedFamilyInfo family)
        {
            var info = family.VolunteerFamilyInfo!;
            return
            [
                .. info
                    .FamilyRoleApprovals.OrderBy(role => role.Key)
                    .Select(role => role.Value.SnoozeEpisodeToken),
                .. info
                    .IndividualVolunteers.OrderBy(person => person.Key)
                    .SelectMany(person =>
                        person
                            .Value.ApprovalStatusByRole.OrderBy(role => role.Key)
                            .Select(role => role.Value.SnoozeEpisodeToken)
                    ),
                .. info.RenewalCandidates.Select(candidate => candidate.SnoozeEpisodeToken),
            ];
        }

        [TestMethod]
        public void RoleAndRenewalTokensDistinguishSubjectsRolesActionsAndOccurrences()
        {
            var family = new FamilyApprovalRenewalTarget(FamilyId);
            var person = new IndividualApprovalRenewalTarget(FamilyId, AdultId);
            var tokens = Tokens(
                ForFamily(
                    Family(
                        true,
                        Renewal(family),
                        Renewal(person),
                        Renewal(family, "Home Study"),
                        Renewal(family, uncovered: Uncovered.AddYears(1))
                    ),
                    Stream(5, (FamilyId, 3)),
                    Policy
                )
            );
            Assert.HasCount(9, tokens);
            Assert.IsTrue(tokens.All(token => token is not null));
            Assert.HasCount(9, tokens.Distinct());

            var uncovered = Tokens(
                ForFamily(
                    Family(true, Renewal(family, state: DisclosedApprovalRenewalState.Uncovered)),
                    Stream(9, (FamilyId, 3), (OtherFamilyId, 8)),
                    Policy
                )
            );
            Assert.AreEqual(
                tokens[5],
                uncovered[5],
                "Upcoming to uncovered keeps the renewal episode."
            );
            CollectionAssert.AreEqual(tokens[..5], uncovered[..5]);
        }

        [TestMethod]
        public void EvidenceDirectoryAndPolicyChangesStartNewApprovalEpisodes()
        {
            var renewal = Renewal(new FamilyApprovalRenewalTarget(FamilyId));
            var baseline = Tokens(
                ForFamily(Family(true, renewal), Stream(5, (FamilyId, 3)), Policy)
            );
            var evidenceChanged = Tokens(
                ForFamily(Family(true, renewal), Stream(6, (FamilyId, 6)), Policy)
            );
            var directoryChanged = Tokens(
                ForFamily(Family(false, renewal), Stream(5, (FamilyId, 3)), Policy)
            );
            var policyRestored = Tokens(
                ForFamily(Family(true, renewal), Stream(5, (FamilyId, 3)), new ETag("\"restored\""))
            );
            foreach (var changed in new[] { evidenceChanged, directoryChanged, policyRestored })
                Assert.IsTrue(baseline.Zip(changed).All(pair => pair.First != pair.Second));
        }

        [TestMethod]
        public void DuplicateRenewalCandidatesStayVisibleWithoutTokens()
        {
            var target = new FamilyApprovalRenewalTarget(FamilyId);
            var certified = ForFamily(
                Family(true, Renewal(target), Renewal(target), Renewal(target, "Home Study")),
                Stream(5, (FamilyId, 3)),
                Policy
            );
            var renewals = certified.VolunteerFamilyInfo!.RenewalCandidates;
            Assert.IsNull(renewals[0].SnoozeEpisodeToken);
            Assert.IsNull(renewals[1].SnoozeEpisodeToken);
            Assert.IsNotNull(renewals[2].SnoozeEpisodeToken);
        }

        [TestMethod]
        public void CommunityTokensFollowOrganizationApprovalEvidence()
        {
            var community = new CommunityInfo(
                new Community(CommunityId, "Community", "", [], [], []),
                []
            )
            {
                ApprovalInfo = new OrganizationApprovalInfo(
                    ImmutableDictionary<string, OrganizationRoleApprovalStatus>.Empty.Add(
                        "Partner",
                        new OrganizationRoleApprovalStatus(null, [])
                    ),
                    [],
                    [],
                    [],
                    [],
                    []
                )
                {
                    RenewalCandidates =
                    [
                        Renewal(new OrganizationApprovalRenewalTarget(CommunityId)),
                    ],
                },
            };
            string?[] Read(CommunityInfo info) =>
                [
                    info.ApprovalInfo!.ApprovalStatusByRole["Partner"].SnoozeEpisodeToken,
                    info.ApprovalInfo.RenewalCandidates.Single().SnoozeEpisodeToken,
                ];
            var first = Read(ForCommunity(community, Stream(4, (CommunityId, 2)), Policy));
            Assert.IsTrue(first.All(token => token is not null));
            CollectionAssert.AreEqual(
                first,
                Read(
                    ForCommunity(
                        community,
                        Stream(7, (CommunityId, 2), (Guid.NewGuid(), 7)),
                        Policy
                    )
                )
            );
            Assert.IsTrue(
                first
                    .Zip(Read(ForCommunity(community, Stream(8, (CommunityId, 8)), Policy)))
                    .All(pair => pair.First != pair.Second)
            );
        }

        [TestMethod]
        public void CertificationAttachesApprovalFreshnessOnlyWithVerifiedStreams()
        {
            var aggregate = new FamilyRecordsAggregate(Family(true));
            var approvals = Stream(5, (FamilyId, 3));
            var directory = Stream(11);

            var certified = (FamilyRecordsAggregate)
                ArrangementSnoozeCertification
                    .Certify(
                        [aggregate],
                        7,
                        Policy,
                        new ApprovalProvenance(approvals, directory, null),
                        Configuration
                    )
                    .Single();
            Assert.AreEqual(7L, certified.SnoozeFreshness!.ReferralsRevision);
            Assert.AreEqual(5L, certified.SnoozeFreshness.ApprovalsRevision);
            Assert.AreEqual(11L, certified.SnoozeFreshness.DirectoryRevision);
            Assert.IsTrue(Tokens(certified.Family).All(token => token is not null));

            var unverified = (FamilyRecordsAggregate)
                ArrangementSnoozeCertification.Certify([aggregate], 7, Policy).Single();
            Assert.IsNull(unverified.SnoozeFreshness!.ApprovalsRevision);
            Assert.IsTrue(Tokens(unverified.Family).All(token => token is null));

            var json = JsonConvert.SerializeObject(certified);
            StringAssert.Contains(json, "\"ApprovalsRevision\":5");
            Assert.IsFalse(json.Contains("OrganizationApprovalsRevision"));
            Assert.IsFalse(JsonConvert.SerializeObject(unverified).Contains("SnoozeEpisodeToken"));
        }

        [TestMethod]
        public void RestoredDirectoryContentAndTimeZonesDoNotResurrectApprovalSnoozes()
        {
            var renewal = Renewal(new FamilyApprovalRenewalTarget(FamilyId));
            var approvals = Stream(5, (FamilyId, 3));
            var original = Tokens(
                ForFamily(Family(true, renewal), approvals, Policy, Stream(11, (FamilyId, 4)))
            );
            CollectionAssert.AreEqual(
                original,
                Tokens(
                    ForFamily(
                        Family(true, renewal),
                        approvals,
                        Policy,
                        Stream(14, (FamilyId, 4), (OtherFamilyId, 14))
                    )
                ),
                "Other families' directory edits keep this family's approval episodes."
            );
            var readded = Tokens(
                ForFamily(Family(true, renewal), approvals, Policy, Stream(13, (FamilyId, 13)))
            );
            Assert.IsTrue(original.Zip(readded).All(pair => pair.First != pair.Second));

            var restoredTimeZone = Tokens(
                ForFamily(
                    Family(true, renewal),
                    approvals,
                    Policy,
                    Stream(11, (FamilyId, 4)),
                    new ETag("\"restored\"")
                )
            );
            Assert.IsTrue(original.Zip(restoredTimeZone).All(pair => pair.First != pair.Second));

            var episode = new ArrangementMonitoringEpisode(
                new ArrangementMonitoringOccurrence(
                    Guid.NewGuid(),
                    Guid.NewGuid(),
                    Guid.NewGuid(),
                    "{}",
                    new DateOnly(2026, 9, 1),
                    new DateOnly(2026, 9, 3)
                ),
                Guid.NewGuid(),
                null,
                Policy
            );
            var arrangementTokens = new[]
            {
                ArrangementSnoozeCertification.Token(episode, Policy, Configuration),
                ArrangementSnoozeCertification.Token(episode, Policy, new ETag("\"restored\"")),
                ArrangementSnoozeCertification.Token(episode, Policy),
            };
            Assert.HasCount(3, arrangementTokens.Distinct());
            Assert.AreEqual(
                arrangementTokens[0],
                ArrangementSnoozeCertification.Token(episode, Policy, Configuration)
            );
        }

        [TestMethod]
        public void UndisclosedApprovalDetailsReceiveNoApprovalFreshness()
        {
            var hidden = new FamilyRecordsAggregate(
                Family(true) with
                {
                    VolunteerFamilyInfo = null,
                }
            );
            var certified = (FamilyRecordsAggregate)
                ArrangementSnoozeCertification
                    .Certify(
                        [hidden],
                        7,
                        Policy,
                        new ApprovalProvenance(Stream(5, (FamilyId, 3)), Stream(11), null),
                        Configuration
                    )
                    .Single();
            Assert.AreEqual(7L, certified.SnoozeFreshness!.ReferralsRevision);
            Assert.IsNull(certified.SnoozeFreshness.ApprovalsRevision);
            Assert.IsNull(certified.SnoozeFreshness.DirectoryRevision);
        }
    }
}
