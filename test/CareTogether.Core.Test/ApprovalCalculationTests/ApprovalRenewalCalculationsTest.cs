using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.OrganizationApprovals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using CompletedRequirementInfo = CareTogether.Resources.CompletedRequirementInfo;
using ExemptedRequirementInfo = CareTogether.Resources.ExemptedRequirementInfo;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public sealed class ApprovalRenewalCalculationsTest
    {
        private const string Check = "Safety check";
        private const string OldName = "Old check";
        private const string Other = "Other check";

        [TestMethod]
        public void FindsUpcomingAndOngoingGapsAndKeepsTheirFirstUncoveredDay()
        {
            var evidence = H.CompletedUntil((Check, 1, 10), (Check, 20, 25));
            var upcoming = Organization(evidence, H.D(9)).Single();
            var uncovered = Organization(evidence, H.D(19)).Single();
            var restored = Organization(evidence, H.D(20)).Single();

            Assert.AreEqual(new ApprovalSubject(ApprovalSubjectKind.Organization, H.guid4), upcoming.Obligation.Subject);
            Assert.AreEqual(H.D(11), upcoming.FirstUncoveredOnUtc);
            Assert.AreEqual(ApprovalRenewalState.Upcoming, upcoming.State);
            Assert.AreEqual(ApprovalRenewalState.Uncovered, uncovered.State);
            Assert.AreEqual(upcoming.FirstUncoveredOnUtc, uncovered.FirstUncoveredOnUtc);
            Assert.AreEqual(H.D(26), restored.FirstUncoveredOnUtc);
            Assert.AreEqual(upcoming.CandidateKey, restored.CandidateKey);
            Assert.IsEmpty(Organization(H.CompletedUntil(), H.D(12)));
        }

        [TestMethod]
        public void UsesContinuousOverlapAndAdjacentCoverageFromCompletionsAndExemptions()
        {
            var evidence = H.CompletedUntil((Check, 1, 10), (Check, 8, 12));
            var exemption = H.ExemptedOn((Check, 13, 20));
            Assert.AreEqual(H.D(21), Organization(evidence, H.D(9), exemption).Single().FirstUncoveredOnUtc);
            Assert.AreEqual(H.D(21), Organization([], H.D(19), exemption).Single().FirstUncoveredOnUtc);
            Assert.IsEmpty(Organization(evidence.AddRange(H.CompletedUntil((Check, 21, null))), H.D(9), exemption));
            Assert.IsEmpty(Organization(evidence.AddRange(H.CompletedUntil((Check, 11, 25))), H.D(9))
                .Where(candidate => candidate.FirstUncoveredOnUtc == H.D(11)).ToArray());
            Assert.IsEmpty(Organization(H.CompletedUntil((Check, 1, null)), DateOnly.MaxValue));
        }

        [TestMethod]
        public void DefersAmbiguousAlternativeWorkflowsAndIgnoresVersionsThatPreserveApproval()
        {
            var policy = Policy(
                Version("v1", Check),
                Version("v2", Other)
            );
            Assert.IsEmpty(Organization(H.CompletedUntil((Check, 1, 10), (Other, 1, 10)), H.D(9), policy: policy));
            var laterLoss = Organization(H.CompletedUntil((Check, 1, 10), (Other, 1, 20)), H.D(9),
                policy: Policy(Version("v1", Check, H.DT(15)), Version("v2", Other))).Single();
            Assert.AreEqual(Other, laterLoss.Obligation.ActionName);
            Assert.AreEqual(H.D(21), laterLoss.FirstUncoveredOnUtc);
            Assert.IsEmpty(Organization(H.CompletedUntil((Check, 1, 10), (Other, 1, null)), H.D(9), policy: policy));
        }

        [TestMethod]
        public void EquivalentVersionsProduceOneCandidatePerDistinctActionInKeyOrder()
        {
            var requirements = ImmutableList.Create(
                new OrganizationApprovalRequirement(RequirementStage.Approval, Check),
                new OrganizationApprovalRequirement(RequirementStage.Application, Other)
            );
            var policy = Policy(new("v1", null, requirements), new("v2", null, requirements.Reverse()));
            var items = Organization(H.CompletedUntil((Check, 1, 10), (Other, 1, 10)), H.D(9), policy: policy);

            CollectionAssert.AreEqual(new[] { Other, Check }, items.Select(item => item.Obligation.ActionName).ToArray());
            Assert.IsTrue(items.All(item => item.FirstUncoveredOnUtc == H.D(11) && item.AffectedRoles.Count == 1));
        }

        [TestMethod]
        public void UsesEligibleVersionsAndCanonicalActionNamesWithoutChangingMatching()
        {
            var evidence = H.CompletedUntil((OldName, 1, 10));
            var superseded = Version("v1", Check, H.DT(8));
            Assert.IsEmpty(Organization(evidence, H.D(9), policy: Policy(superseded)));
            var item = Organization(evidence, H.D(9), policy: Policy(superseded, Version("v2", OldName))).Single();
            Assert.AreEqual(Check, item.Obligation.ActionName);
            Assert.AreEqual(H.D(11), item.FirstUncoveredOnUtc);
        }

        [DataRow(RoleRemovalReason.Denied)]
        [DataRow(RoleRemovalReason.Inactive)]
        [TestMethod]
        public void ExcludesRolesRemovedBeforeTheLoss(RoleRemovalReason reason)
        {
            var removals = ImmutableList.Create(new RoleRemoval("Partner", reason, H.D(10), null, null));
            Assert.IsEmpty(Organization(H.CompletedUntil((Check, 1, 11)), H.D(9), removals: removals));
        }

        [TestMethod]
        public void GroupsSharedFamilyAndIndividualRolesByEvidenceSubjectAndKeepsMembersSeparate()
        {
            var policy = FamilyPolicy();
            var first = Person(H.guid1);
            var second = Person(H.guid2);
            var family = new Family(H.guid3, true, first.Id,
                [(first, new FamilyAdultRelationshipInfo("Adult", true)), (second, new FamilyAdultRelationshipInfo("Adult", true))],
                [], [], [], [], [], [], false);
            var evidence = H.CompletedUntil((Check, 1, 10), (Other, 1, 5));
            var people = ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>>.Empty
                .Add(first.Id, evidence).Add(second.Id, evidence);

            ImmutableList<ApprovalRenewalCandidate> Calculate(Family subject) =>
                ApprovalRenewalCalculations.ForFamily(policy, H.guid8, H.guid9, subject,
                    ApprovalCalculations.CalculateCombinedFamilyApprovals(
                        policy, subject, evidence, [], [], people,
                        ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>>.Empty,
                        ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty),
                    H.D(9));

            var items = Calculate(family);
            Assert.HasCount(3, items);
            Assert.AreEqual(3, items.Select(item => item.CandidateKey).Distinct().Count());
            Assert.AreEqual(ApprovalSubjectKind.Family, items[0].Obligation.Subject.Kind);
            Assert.AreEqual(first.Id, items[1].Obligation.Subject.PersonId);
            Assert.AreEqual(second.Id, items[2].Obligation.Subject.PersonId);
            CollectionAssert.AreEqual(new[] { "Household", "Volunteer" },
                items[1].AffectedRoles.Select(role => role.RoleName).ToArray());
            Assert.IsTrue(items.All(item => item.Obligation.ActionName == Check));

            var oneActive = family with { Adults = family.Adults.SetItem(1, (second with { Active = false }, family.Adults[1].Item2)) };
            Assert.HasCount(2, Calculate(oneActive));
            Assert.IsEmpty(Calculate(family with { Active = false }));
        }

        [TestMethod]
        public async Task EngineKeepsAliasValidityBehaviorAndDoesNotSerializeCandidates()
        {
            var policy = Policy(Version("v1", Check));
            var resource = new Mock<IPoliciesResource>();
            resource.Setup(x => x.GetCurrentPolicy(H.guid8, H.guid9)).ReturnsAsync(policy);
            var engine = new PolicyEvaluationEngine(resource.Object);
            var result = await engine.CalculateOrganizationApprovalsAsync(H.guid8, H.guid9,
                new OrganizationApprovalEntry(H.guid4,
                    H.CompletedUntil((OldName, 1, null), (Check, 1, null)), [], []));
            Assert.IsNull(result.CompletedRequirements[0].ExpiresAtUtc);
            Assert.AreEqual(H.DT(11), result.CompletedRequirements[1].ExpiresAtUtc);
            Assert.IsEmpty(result.RenewalCandidates);
            var expired = await engine.CalculateOrganizationApprovalsAsync(H.guid8, H.guid9,
                new OrganizationApprovalEntry(H.guid4, H.CompletedUntil((Check, 1, null)), [], []));
            Assert.AreEqual(H.D(12), expired.RenewalCandidates.Single().FirstUncoveredOnUtc);
            Assert.IsFalse(System.Text.Json.JsonSerializer.Serialize(expired).Contains("RenewalCandidates", StringComparison.Ordinal));
            Assert.IsFalse(Newtonsoft.Json.JsonConvert.SerializeObject(expired).Contains("RenewalCandidates", StringComparison.Ordinal));
        }

        private static Person Person(Guid id) =>
            new(id, true, "First", "Last", null, null, null, [], null, [], null, [], null, null, null);

        private static OrganizationRolePolicyVersion Version(string version, string action, DateTime? superseded = null) =>
            new(version, superseded, [new OrganizationApprovalRequirement(RequirementStage.Approval, action)]);

        private static EffectiveLocationPolicy Policy(params OrganizationRolePolicyVersion[] versions) =>
            new(
                ImmutableDictionary<string, ActionRequirement>.Empty
                    .Add(Check, new(DocumentLinkRequirement.None, NoteEntryRequirement.None, null, null, TimeSpan.FromDays(10), null, null, [OldName]))
                    .Add(Other, new(DocumentLinkRequirement.None, NoteEntryRequirement.None, null, null, null, null, null, [])),
                [],
                new V1CasePolicy([], [], [], []),
                new VolunteerPolicy(ImmutableDictionary<string, VolunteerRolePolicy>.Empty, ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty)
            )
            {
                OrganizationApprovalPolicy = new(ImmutableDictionary<string, OrganizationRolePolicy>.Empty
                    .Add("Partner", new("Partner", versions.ToImmutableList()))),
            };

        private static EffectiveLocationPolicy FamilyPolicy() =>
            Policy() with
            {
                VolunteerPolicy = new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty.Add("Volunteer",
                        new("Volunteer", [new("v1", null, [
                            new(RequirementStage.Approval, Check),
                            new(RequirementStage.Approval, Other, IsRequired: false),
                        ])])),
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                        .Add("Family", new("Family", [new("v1", null, [
                            new(RequirementStage.Approval, Check, VolunteerFamilyRequirementScope.OncePerFamily),
                            new(RequirementStage.Onboarding, Other, VolunteerFamilyRequirementScope.OncePerFamily),
                        ])]))
                        .Add("Household", new("Household", [new("v1", null, [
                            new(RequirementStage.Approval, OldName, VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
                        ])]))
                ),
            };

        private static ImmutableList<ApprovalRenewalCandidate> Organization(
            ImmutableList<CompletedRequirementInfo> completions,
            DateOnly today,
            ImmutableList<ExemptedRequirementInfo>? exemptions = null,
            EffectiveLocationPolicy? policy = null,
            ImmutableList<RoleRemoval>? removals = null
        )
        {
            policy ??= Policy(Version("v1", Check));
            var approvals = OrganizationApprovalCalculations.Calculate(policy,
                new OrganizationApprovalEntry(H.guid4, completions, exemptions ?? [], removals ?? []));
            return ApprovalRenewalCalculations.ForOrganization(policy, H.guid8, H.guid9, H.guid4, approvals, today);
        }
    }
}
