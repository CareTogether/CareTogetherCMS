using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public sealed class RequirementRoleAttributionTests
    {
        [TestMethod]
        public void FamilyRequirementRoleNamesIncludeEveryMatchingFamilyRole()
        {
            var policy = BuildPolicyWithSynonym("Background Check", "BG Check");
            var familyRoleApprovals = ImmutableDictionary<
                string,
                FamilyRoleApprovalStatus
            >.Empty.Add(
                "Host Family",
                FamilyRoleApproval("Host Family", "Background Check")
            )
                .Add("Respite Care", FamilyRoleApproval("Respite Care", "Background Check"));

            var roleNames = RequirementRoleAttribution.GetFamilyRequirementRoleNames(
                policy,
                familyRoleApprovals,
                "BG Check"
            );

            CollectionAssert.AreEquivalent(
                new[] { "Host Family", "Respite Care" },
                roleNames.ToArray()
            );
        }

        [TestMethod]
        public void IndividualRequirementRoleNamesIncludeDirectAndFamilyAdultRequirementRoles()
        {
            var policy = BuildPolicyWithSynonym("Background Check", "BG Check");
            var familyRoleApprovals = ImmutableDictionary<
                string,
                FamilyRoleApprovalStatus
            >.Empty.Add(
                "Host Family",
                FamilyRoleApproval(
                    "Host Family",
                    "Background Check",
                    VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                )
            );
            var individualApprovalsByRole = ImmutableDictionary<
                string,
                IndividualRoleApprovalStatus
            >.Empty.Add(
                "Family Friend",
                IndividualRoleApproval("Family Friend", "Background Check")
            );

            var roleNames = RequirementRoleAttribution.GetIndividualRequirementRoleNames(
                policy,
                familyRoleApprovals,
                individualApprovalsByRole,
                H.guid1,
                "BG Check"
            );

            CollectionAssert.AreEquivalent(
                new[] { "Family Friend", "Host Family" },
                roleNames.ToArray()
            );
        }

        [TestMethod]
        public async Task VolunteerFamilyApprovalCalculationResultIncludesRequirementRoleNames()
        {
            var policiesResource = new Mock<IPoliciesResource>();
            policiesResource
                .Setup(x => x.GetCurrentPolicy(H.guid0, H.guid0))
                .ReturnsAsync(BuildCalculationPolicy());
            var engine = new PolicyEvaluationEngine(policiesResource.Object);
            var volunteerFamily = new VolunteerFamilyEntry(
                H.guid0,
                H.Completed(("Background Check", 1)),
                H.Exempted(("Background Check", null)),
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, VolunteerEntry>.Empty.Add(
                    H.guid1,
                    new VolunteerEntry(
                        H.guid1,
                        Active: true,
                        Note: "",
                        H.Completed(("Background Check", 1)),
                        H.Exempted(("Background Check", null)),
                        ImmutableList<RoleRemoval>.Empty
                    )
                ),
                ImmutableList<Activity>.Empty
            );

            var result = await engine.CalculateVolunteerFamilyApprovalsAsync(
                H.guid0,
                H.guid0,
                CreateTestFamily(),
                volunteerFamily
            );

            CollectionAssert.AreEquivalent(
                new[] { "Host Family", "Respite Care" },
                result.CompletedFamilyRequirements.Single().RoleNames!.ToArray()
            );
            CollectionAssert.AreEquivalent(
                new[] { "Host Family", "Respite Care" },
                result.ExemptedFamilyRequirements.Single().RoleNames!.ToArray()
            );
            CollectionAssert.AreEquivalent(
                new[] { "Family Friend", "Household Member" },
                result.CompletedIndividualRequirements[H.guid1].Single().RoleNames!.ToArray()
            );
            CollectionAssert.AreEquivalent(
                new[] { "Family Friend", "Household Member" },
                result.ExemptedIndividualRequirements[H.guid1].Single().RoleNames!.ToArray()
            );
        }

        private static EffectiveLocationPolicy BuildPolicyWithSynonym(
            string actionName,
            string alternateName
        ) =>
            new(
                ImmutableDictionary<string, ActionRequirement>.Empty.Add(
                    actionName,
                    new ActionRequirement(
                        DocumentLinkRequirement.None,
                        NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        ImmutableList.Create(alternateName)
                    )
                ),
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    RequiredIntakeActionNames: ImmutableList<string>.Empty,
                    CustomFields: ImmutableList<CustomField>.Empty,
                    ArrangementPolicies: ImmutableList<ArrangementPolicy>.Empty,
                    FunctionPolicies: null
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    VolunteerRoles: ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    VolunteerFamilyRoles: ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

        private static EffectiveLocationPolicy BuildCalculationPolicy() =>
            BuildPolicyWithSynonym("Background Check", "BG Check") with
            {
                VolunteerPolicy = new VolunteerPolicy(
                    VolunteerRoles: ImmutableDictionary<string, VolunteerRolePolicy>.Empty.Add(
                        "Family Friend",
                        new VolunteerRolePolicy(
                            "Family Friend",
                            ImmutableList.Create(
                                new VolunteerRolePolicyVersion(
                                    Version: "2024",
                                    SupersededAtUtc: null,
                                    ImmutableList.Create(
                                        new VolunteerApprovalRequirement(
                                            RequirementStage.Approval,
                                            "Background Check"
                                        )
                                    )
                                )
                            )
                        )
                    ),
                    VolunteerFamilyRoles: ImmutableDictionary<
                        string,
                        VolunteerFamilyRolePolicy
                    >.Empty.Add(
                        "Host Family",
                        FamilyPolicy(
                            "Host Family",
                            VolunteerFamilyRequirementScope.OncePerFamily
                        )
                    )
                        .Add(
                            "Respite Care",
                            FamilyPolicy(
                                "Respite Care",
                                VolunteerFamilyRequirementScope.OncePerFamily
                            )
                        )
                        .Add(
                            "Household Member",
                            FamilyPolicy(
                                "Household Member",
                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                            )
                        )
                ),
            };

        private static VolunteerFamilyRolePolicy FamilyPolicy(
            string roleName,
            VolunteerFamilyRequirementScope scope
        ) =>
            new(
                roleName,
                ImmutableList.Create(
                    new VolunteerFamilyRolePolicyVersion(
                        Version: "2024",
                        SupersededAtUtc: null,
                        ImmutableList.Create(
                            new VolunteerFamilyApprovalRequirement(
                                RequirementStage.Approval,
                                "Background Check",
                                scope
                            )
                        )
                    )
                )
            );

        private static Family CreateTestFamily()
        {
            var adult = new Person(
                H.guid1,
                Active: true,
                "John",
                "Doe",
                Gender.Male,
                new AgeInYears(35, DateTime.Now),
                "Caucasian",
                ImmutableList<Address>.Empty,
                CurrentAddressId: null,
                ImmutableList<PhoneNumber>.Empty,
                PreferredPhoneNumberId: null,
                ImmutableList<EmailAddress>.Empty,
                PreferredEmailAddressId: null,
                Concerns: null,
                Notes: null
            );

            return new Family(
                H.guid0,
                Active: true,
                PrimaryFamilyContactPersonId: H.guid1,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty.Add(
                    (adult, new FamilyAdultRelationshipInfo("Parent", IsInHousehold: true))
                ),
                ImmutableList<Person>.Empty,
                ImmutableList<CustodialRelationship>.Empty,
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CompletedCustomFieldInfo>.Empty,
                ImmutableList<Activity>.Empty,
                IsTestFamily: false
            );
        }

        private static FamilyRoleApprovalStatus FamilyRoleApproval(
            string roleName,
            string requirementName,
            VolunteerFamilyRequirementScope scope = VolunteerFamilyRequirementScope.OncePerFamily
        ) =>
            new(
                EffectiveRoleApprovalStatus: null,
                ImmutableList.Create(
                    new FamilyRoleVersionApprovalStatus(
                        roleName,
                        Version: "2024",
                        Status: null,
                        ImmutableList.Create(
                            new FamilyRoleRequirementCompletionStatus(
                                requirementName,
                                RequirementStage.Approval,
                                scope,
                                WhenMet: null,
                                ImmutableList.Create(
                                    new FamilyRequirementStatusDetail(H.guid1, null)
                                )
                            )
                        )
                    )
                )
            );

        private static IndividualRoleApprovalStatus IndividualRoleApproval(
            string roleName,
            string requirementName
        ) =>
            new(
                EffectiveRoleApprovalStatus: null,
                ImmutableList.Create(
                    new IndividualRoleVersionApprovalStatus(
                        roleName,
                        Version: "2024",
                        Status: null,
                        ImmutableList.Create(
                            new IndividualRoleRequirementCompletionStatus(
                                requirementName,
                                RequirementStage.Approval,
                                WhenMet: null
                            )
                        )
                    )
                )
            );
    }
}
