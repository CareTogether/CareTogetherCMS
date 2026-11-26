using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.OrganizationApprovals;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1ReferralNotes;
using CareTogether.Resources.V1Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using JsonSerializer = System.Text.Json.JsonSerializer;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class RecordsApprovalRenewalTests
    {
        private const string Action = "Safety check";
        private const string Role = "Partner";
        private static readonly ImmutableList<Permission> ViewRenewals =
            [Permission.ViewApprovalStatus, Permission.ViewApprovalProgress];
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private static readonly JsonSerializerSettings WireSettings = new()
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
        };

        [TestMethod]
        public async Task FamilyDisclosureFiltersTargetsAndRolesBeforeSerialization()
        {
            var adult = Person(H.guid1);
            var child = Person(H.guid2);
            var family = new Family(H.guid3, true, adult.Id,
                [(adult, new FamilyAdultRelationshipInfo(null, true))],
                [child], [], [], [], [], [], false);
            var familySubject = new ApprovalSubject(ApprovalSubjectKind.Family, family.Id);
            var individualSubject = new ApprovalSubject(ApprovalSubjectKind.Individual, family.Id, adult.Id);
            var childSubject = new ApprovalSubject(ApprovalSubjectKind.Individual, family.Id, child.Id);
            var individual = new VolunteerInfo(
                ImmutableDictionary<string, IndividualRoleApprovalStatus>.Empty.Add(Role, new(null, [])),
                [], [], [], [], [], []);
            var volunteer = new VolunteerFamilyInfo(
                ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty.Add(Role, new(null, [])),
                [], [], [], [], [], [],
                ImmutableDictionary<Guid, VolunteerInfo>.Empty.Add(adult.Id, individual).Add(child.Id, individual),
                [], [])
            {
                InternalRenewalCandidates = [
                    Candidate("family", familySubject, new ApprovalRenewalRole(familySubject, Role)),
                    Candidate("adult", individualSubject, new(individualSubject, Role),
                        new(familySubject, Role), new(individualSubject, "undisclosed-role"), new(childSubject, Role)),
                    Candidate("undisclosed-child", childSubject, new ApprovalRenewalRole(childSubject, Role)),
                    Candidate("other-family", familySubject with { RecordId = H.guid7 }, new ApprovalRenewalRole(familySubject, Role)),
                    Candidate("undisclosed-only", individualSubject, new ApprovalRenewalRole(individualSubject, "undisclosed-role")),
                ],
            };
            var combined = new CombinedFamilyInfo(family, [], null, volunteer, [], [], [], []);
            var authorization = new AuthorizationEngine(null!, null!, null!, null!, null!, null!);
            var user = new SessionUserContext(User(), null);

            foreach (var permissions in new ImmutableList<Permission>[]
            {
                [], [Permission.ViewApprovalStatus], [Permission.ViewApprovalProgress], ViewRenewals,
            })
            {
                var disclosed = await authorization.DiscloseFamilyAsync(user, H.guid8, H.guid9, combined, permissions);
                var payload = JsonConvert.SerializeObject(new FamilyRecordsAggregate(disclosed), WireSettings);
                var roundTrip = (FamilyRecordsAggregate)JsonConvert.DeserializeObject<RecordsAggregate>(payload, WireSettings)!;
                var candidates = roundTrip.Family.VolunteerFamilyInfo!.RenewalCandidates;
                Assert.HasCount(permissions == ViewRenewals ? 2 : 0, candidates);
                Assert.DoesNotContain("undisclosed", payload);
                Assert.DoesNotContain("other-family", payload);
                Assert.DoesNotContain("internalRenewalCandidates", payload);

                if (permissions != ViewRenewals)
                    continue;

                Assert.AreEqual(new FamilyApprovalRenewalTarget(family.Id), candidates[0].Target);
                Assert.AreEqual(new IndividualApprovalRenewalTarget(family.Id, adult.Id), candidates[1].Target);
                CollectionAssert.AreEqual(
                    new[] { ApprovalRenewalRoleScope.Individual, ApprovalRenewalRoleScope.Family },
                    candidates[1].AffectedRoles.Select(role => role.Scope).ToArray());
                Assert.Contains("\"firstUncoveredOnUtc\":\"2024-01-11\"", payload);
                Assert.DoesNotContain("InternalRenewalCandidates", Newtonsoft.Json.JsonConvert.SerializeObject(combined));
                Assert.DoesNotContain("undisclosed-child", JsonSerializer.Serialize(combined, JsonOptions));
            }
        }

        [TestMethod]
        public async Task RecordsReadsAndOrganizationEvidenceCommandsReturnCurrentScopedCandidates()
        {
            var tenant = H.guid8;
            var location = H.guid9;
            var community = new Community(H.guid4, "Partner organization", "", [], [], []);
            var today = DateTime.UtcNow.Date;
            var policy = Policy();
            var original = new OrganizationApprovalEntry(community.Id,
                [new(H.guid0, today.AddDays(-20), H.guid1, Action, today.AddDays(-20), null, null, null)], [], []);
            var adult = Person(H.guid1);
            var family = new Family(H.guid3, true, adult.Id,
                [(adult, new FamilyAdultRelationshipInfo(null, true))], [], [], [], [], [], [], false);
            var volunteerFamily = new VolunteerFamilyEntry(
                family.Id, original.CompletedRequirements, [], [], [],
                ImmutableDictionary<Guid, VolunteerEntry>.Empty.Add(adult.Id,
                    new VolunteerEntry(adult.Id, true, "", original.CompletedRequirements, [], [])),
                []);
            var entry = original;
            var permissions = ViewRenewals;
            var policies = new Mock<IPoliciesResource>();
            policies.Setup(x => x.GetCurrentPolicy(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync(policy);
            var directory = new Mock<IDirectoryResource>();
            directory.Setup(x => x.ListFamiliesAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            directory.Setup(x => x.ListFamiliesAsync(tenant, location)).ReturnsAsync([family]);
            directory.Setup(x => x.FindFamilyAsync(tenant, location, family.Id)).ReturnsAsync(family);
            var approvals = new Mock<IApprovalsResource>();
            approvals.Setup(x => x.ListVolunteerFamiliesAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            approvals.Setup(x => x.ListVolunteerFamiliesAsync(tenant, location)).ReturnsAsync(() => [volunteerFamily]);
            approvals.Setup(x => x.TryGetVolunteerFamilyAsync(tenant, location, family.Id)).ReturnsAsync(() => volunteerFamily);
            approvals.Setup(x => x.ExecuteVolunteerFamilyCommandAsync(
                tenant, location, It.IsAny<VolunteerFamilyCommand>(), H.guid0))
                .ReturnsAsync((Guid _, Guid _, VolunteerFamilyCommand command, Guid _) =>
                {
                    var completion = (CompleteVolunteerFamilyRequirement)command;
                    volunteerFamily = volunteerFamily with
                    {
                        CompletedRequirements = volunteerFamily.CompletedRequirements.Add(
                            new(H.guid0, today, completion.CompletedRequirementId, Action,
                                completion.CompletedAtUtc, null, null, null)),
                    };
                    return volunteerFamily;
                });
            var cases = new Mock<IV1CasesResource>();
            cases.Setup(x => x.ListV1CasessAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            cases.Setup(x => x.ListV1CasesForFamilyAsync(tenant, location, family.Id)).ReturnsAsync([]);
            cases.Setup(x => x.ListV1CasesAssignedToVolunteerFamilyAsync(tenant, location, family.Id)).ReturnsAsync([]);
            var referrals = new Mock<IV1ReferralsResource>();
            referrals.Setup(x => x.ListReferralsAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            referrals.Setup(x => x.ListReferralsForFamilyAsync(tenant, location, family.Id)).ReturnsAsync([]);
            var notes = new Mock<INotesResource>();
            notes.Setup(x => x.ListNotesAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            notes.Setup(x => x.ListFamilyNotesAsync(tenant, location, family.Id)).ReturnsAsync([]);
            var communities = new Mock<ICommunitiesResource>();
            communities.Setup(x => x.ListLocationCommunitiesAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            communities.Setup(x => x.ListLocationCommunitiesAsync(tenant, location)).ReturnsAsync([community]);
            var organizationApprovals = new Mock<IOrganizationApprovalsResource>();
            organizationApprovals.Setup(x => x.ListAsync(It.IsAny<Guid>(), It.IsAny<Guid>())).ReturnsAsync([]);
            organizationApprovals.Setup(x => x.ListAsync(tenant, location)).ReturnsAsync(() => [entry]);
            organizationApprovals.Setup(x => x.TryGetAsync(tenant, location, community.Id)).ReturnsAsync(() => entry);
            organizationApprovals.Setup(x => x.ExecuteCommandAsync(tenant, location, It.IsAny<OrganizationApprovalCommand>(), H.guid0))
                .ReturnsAsync((Guid _, Guid _, OrganizationApprovalCommand command, Guid _) =>
                {
                    entry = command switch
                    {
                        CompleteOrganizationRequirement completion => entry with
                        {
                            CompletedRequirements = entry.CompletedRequirements.Add(
                                new(H.guid0, today, completion.CompletedRequirementId, Action,
                                    completion.CompletedAtUtc, null, null, null)),
                        },
                        ExemptOrganizationRequirement => original with
                        {
                            ExemptedRequirements = [new(H.guid0, today, Action, null, "", null)],
                        },
                        MarkOrganizationRequirementIncomplete or UnexemptOrganizationRequirement => original,
                        _ => throw new InvalidOperationException(),
                    };
                    return entry;
                });
            var access = new Mock<IUserAccessCalculation>();
            access.Setup(x => x.AuthorizeUserAccess(It.IsAny<UserAccessCalculationSnapshot>(),
                It.Is<CommunityAuthorizationContext>(c => c.CommunityId == community.Id))).Returns(() => permissions);
            access.Setup(x => x.AuthorizeUserAccess(It.IsAny<UserAccessCalculationSnapshot>(),
                It.Is<FamilyAuthorizationContext>(c => c.FamilyId == family.Id))).Returns(() => permissions);
            access.Setup(x => x.AuthorizeUserAccessAsync(tenant, location, It.IsAny<SessionUserContext>(),
                It.Is<CommunityAuthorizationContext>(c => c.CommunityId == community.Id))).ReturnsAsync(() => permissions);
            access.Setup(x => x.AuthorizeUserAccessAsync(tenant, location, It.IsAny<SessionUserContext>(),
                It.Is<FamilyAuthorizationContext>(c => c.FamilyId == family.Id))).ReturnsAsync(() => permissions);
            var accounts = Mock.Of<IAccountsResource>();
            var evaluator = new PolicyEvaluationEngine(policies.Object);
            var authorization = new AuthorizationEngine(policies.Object, directory.Object, accounts,
                notes.Object, access.Object, referrals.Object);
            var formatter = new CombinedFamilyInfoFormatter(evaluator, authorization, approvals.Object, cases.Object,
                referrals.Object, directory.Object, notes.Object, policies.Object, accounts);
            var manager = new RecordsManager(policies.Object, authorization, evaluator, access.Object, directory.Object,
                accounts, approvals.Object, organizationApprovals.Object, cases.Object, referrals.Object,
                Mock.Of<IV1ReferralNotesResource>(), notes.Object, communities.Object, formatter);
            Task<ImmutableList<RecordsAggregate>> List() => manager.ListVisibleAggregatesAsync(User(), tenant, location);
            Task<ImmutableList<RecordsAggregate>> Execute(OrganizationApprovalCommand command) =>
                manager.ExecuteAtomicRecordsCommandAsync(tenant, location, User(), new OrganizationApprovalRecordsCommand(command));

            var initial = await List();
            var familyPayload = JsonConvert.SerializeObject(initial.OfType<FamilyRecordsAggregate>().Single(), WireSettings);
            var familyCandidates = DeserializeCandidates(
                JObject.Parse(familyPayload)["family"]!["volunteerFamilyInfo"]!["renewalCandidates"]!
            );
            CollectionAssert.AreEquivalent(
                new ApprovalRenewalTarget[] { new FamilyApprovalRenewalTarget(family.Id), new IndividualApprovalRenewalTarget(family.Id, adult.Id) },
                familyCandidates.Select(candidate => candidate.Target).ToArray());
            var uncovered = ReadCandidates(initial).Single();
            Assert.AreEqual(new OrganizationApprovalRenewalTarget(community.Id), uncovered.Target);
            Assert.AreEqual(DisclosedApprovalRenewalState.Uncovered, uncovered.State);
            Assert.AreEqual(DateOnly.FromDateTime(today.AddDays(-9)), uncovered.FirstUncoveredOnUtc);
            Assert.Contains(tenant.ToString("D"), uncovered.CandidateKey);
            Assert.Contains(location.ToString("D"), uncovered.CandidateKey);
            Assert.IsEmpty(await manager.ListVisibleAggregatesAsync(User(), tenant, H.guid7));
            Assert.IsEmpty(await manager.ListVisibleAggregatesAsync(User(), H.guid7, location));

            permissions = [Permission.ViewApprovalStatus];
            Assert.IsEmpty(ReadCandidates(await List()));
            permissions = [Permission.ViewApprovalProgress];
            Assert.IsEmpty(ReadCandidates(await List()));
            permissions = [];
            Assert.IsEmpty(await List());
            permissions = ViewRenewals.Add(Permission.EditApprovalRequirementCompletion)
                .Add(Permission.EditApprovalRequirementExemption);

            var familyUpdate = (FamilyRecordsAggregate)(await manager.ExecuteAtomicRecordsCommandAsync(
                tenant, location, User(), new FamilyApprovalRecordsCommand(
                    new CompleteVolunteerFamilyRequirement(family.Id, H.guid5, Action, today, null, null)))).Single();
            var updatedCandidates = familyUpdate.Family.VolunteerFamilyInfo!.RenewalCandidates;
            Assert.AreEqual(DisclosedApprovalRenewalState.Upcoming,
                updatedCandidates.Single(x => x.Target is FamilyApprovalRenewalTarget).State);
            Assert.AreEqual(DisclosedApprovalRenewalState.Uncovered,
                updatedCandidates.Single(x => x.Target is IndividualApprovalRenewalTarget).State);

            var renewed = ReadCandidates(await Execute(
                new CompleteOrganizationRequirement(community.Id, H.guid2, Action, today, null, null))).Single();
            Assert.AreEqual(uncovered.CandidateKey, renewed.CandidateKey);
            Assert.AreEqual(DisclosedApprovalRenewalState.Upcoming, renewed.State);
            Assert.AreEqual(DateOnly.FromDateTime(today.AddDays(11)), renewed.FirstUncoveredOnUtc);
            var reversed = ReadCandidates(await Execute(
                new MarkOrganizationRequirementIncomplete(community.Id, H.guid2, Action))).Single();
            Assert.AreEqual(uncovered.FirstUncoveredOnUtc, reversed.FirstUncoveredOnUtc);
            Assert.AreEqual(DisclosedApprovalRenewalState.Uncovered, reversed.State);
            Assert.IsEmpty(ReadCandidates(await Execute(new ExemptOrganizationRequirement(community.Id, Action, "", null))));
            Assert.AreEqual(uncovered.FirstUncoveredOnUtc, ReadCandidates(await Execute(
                new UnexemptOrganizationRequirement(community.Id, Action))).Single().FirstUncoveredOnUtc);
        }

        private static ImmutableList<DisclosedApprovalRenewalCandidate> ReadCandidates(ImmutableList<RecordsAggregate> records)
        {
            var payload = JsonConvert.SerializeObject(records, WireSettings);
            Assert.DoesNotContain("internalRenewalCandidates", payload);
            var community = JArray.Parse(payload).Single(record => record["community"] != null);
            return DeserializeCandidates(community["community"]!["approvalInfo"]!["renewalCandidates"]!);
        }

        private static ImmutableList<DisclosedApprovalRenewalCandidate> DeserializeCandidates(JToken token) =>
            token.ToObject<ImmutableList<DisclosedApprovalRenewalCandidate>>(
                Newtonsoft.Json.JsonSerializer.Create(WireSettings))!;

        private static EffectiveLocationPolicy Policy() =>
            new(
                ImmutableDictionary<string, ActionRequirement>.Empty.Add(Action,
                    new(DocumentLinkRequirement.None, NoteEntryRequirement.None, null, null, TimeSpan.FromDays(10), null, null, [])),
                [], new V1CasePolicy([], [], [], []),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty.Add(Role,
                        new(Role, [new("v1", null, [new(RequirementStage.Approval, Action)])])),
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty.Add(Role,
                        new(Role, [new("v1", null, [new(RequirementStage.Approval, Action, VolunteerFamilyRequirementScope.OncePerFamily)])]))
                )
            )
            {
                OrganizationApprovalPolicy = new(ImmutableDictionary<string, OrganizationRolePolicy>.Empty.Add(Role,
                    new(Role, [new("v1", null, [new(RequirementStage.Approval, Action)])]))),
            };

        private static ApprovalRenewalCandidate Candidate(string key, ApprovalSubject subject, params ApprovalRenewalRole[] roles) =>
            new(key, new(subject, Action), H.D(11), ApprovalRenewalState.Upcoming, roles.ToImmutableList());

        private static Person Person(Guid id) =>
            new(id, true, "First", "Last", null, null, null, [], null, [], null, [], null, null, null);

        private static ClaimsPrincipal User() =>
            new(new ClaimsIdentity([new Claim(CareTogether.Claims.UserId, H.guid0.ToString())], "test"));
    }
}
