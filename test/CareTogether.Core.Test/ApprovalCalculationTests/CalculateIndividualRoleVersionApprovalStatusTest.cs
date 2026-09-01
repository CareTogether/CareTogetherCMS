using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateIndividualRoleVersionApprovalStatusTest
    {
        private static readonly EffectiveLocationPolicy TestLocationPolicy =
            new EffectiveLocationPolicy(
                ImmutableDictionary<string, ActionRequirement>.Empty,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

        [TestMethod]
        public void WhenNoneCompleted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleVersionApprovalStatus(
                    locationPolicy: TestLocationPolicy,
                    new VolunteerRolePolicy("Family Coach", []),
                    new VolunteerRolePolicyVersion(
                        "v1",
                        SupersededAtUtc: H.DT(20),
                        H.IndividualApprovalRequirements(
                            (RequirementStage.Application, "A"),
                            (RequirementStage.Approval, "B"),
                            (RequirementStage.Approval, "C"),
                            (RequirementStage.Approval, "D"),
                            (RequirementStage.Onboarding, "E"),
                            (RequirementStage.Onboarding, "F")
                        )
                    ),
                    completedRequirements: [],
                    exemptedRequirements: [],
                    removalsOfThisRole: []
                );

            Assert.AreEqual("v1", result.Version);
            Assert.AreEqual(null, result.Status);
            Assert.IsTrue(
                result.Requirements.SequenceEqual(
                    [
                        new("A", RequirementStage.Application, WhenMet: null),
                        new("B", RequirementStage.Approval, WhenMet: null),
                        new("C", RequirementStage.Approval, WhenMet: null),
                        new("D", RequirementStage.Approval, WhenMet: null),
                        new("E", RequirementStage.Onboarding, WhenMet: null),
                        new("F", RequirementStage.Onboarding, WhenMet: null),
                    ]
                )
            );
        }

        [TestMethod]
        public void WhenSomeCompletedAndSomeExempted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleVersionApprovalStatus(
                    locationPolicy: TestLocationPolicy,
                    new VolunteerRolePolicy("Family Coach", []),
                    new VolunteerRolePolicyVersion(
                        "v1",
                        SupersededAtUtc: H.DT(20),
                        H.IndividualApprovalRequirements(
                            (RequirementStage.Application, "A"),
                            (RequirementStage.Approval, "B"),
                            (RequirementStage.Approval, "C"),
                            (RequirementStage.Approval, "D"),
                            (RequirementStage.Onboarding, "E"),
                            (RequirementStage.Onboarding, "F")
                        )
                    ),
                    completedRequirements:
                    [
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid1,
                            RequirementName: "A",
                            CompletedAtUtc: H.DT(5),
                            ExpiresAtUtc: H.DT(12),
                            null,
                            null
                        ),
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid2,
                            RequirementName: "B",
                            CompletedAtUtc: H.DT(7),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid3,
                            RequirementName: "A",
                            CompletedAtUtc: H.DT(14),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid4,
                            RequirementName: "C",
                            CompletedAtUtc: H.DT(10),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid5,
                            RequirementName: "E",
                            CompletedAtUtc: H.DT(25),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                    ],
                    exemptedRequirements:
                    [
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(11),
                            RequirementName: "D",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: H.DT(20)
                        ),
                    ],
                    removalsOfThisRole:
                    [
                        new RoleRemoval(
                            "Irrelevant",
                            RoleRemovalReason.Denied,
                            H.D(16),
                            H.D(17),
                            null
                        ),
                        new RoleRemoval(
                            "Irrelevant",
                            RoleRemovalReason.Inactive,
                            H.D(23),
                            null,
                            null
                        ),
                    ]
                );

            Assert.AreEqual("v1", result.Version);
            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(5, 10, RoleApprovalStatus.Prospective),
                        H.DR(11, 12, RoleApprovalStatus.Approved),
                        H.DR(13, 13, RoleApprovalStatus.Expired),
                        H.DR(14, 15, RoleApprovalStatus.Approved),
                        H.DR(16, 17, RoleApprovalStatus.Denied),
                        H.DR(18, 20, RoleApprovalStatus.Approved),
                        H.DR(21, 22, RoleApprovalStatus.Expired),
                        H.DR(23, null, RoleApprovalStatus.Inactive),
                    ]
                ),
                result.Status
            );
            Assert.IsTrue(
                result.Requirements.SequenceEqual(
                    [
                        new(
                            "A",
                            RequirementStage.Application,
                            WhenMet: new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                        ),
                        new(
                            "B",
                            RequirementStage.Approval,
                            WhenMet: new DateOnlyTimeline([H.DR(7, null)])
                        ),
                        new(
                            "C",
                            RequirementStage.Approval,
                            WhenMet: new DateOnlyTimeline([H.DR(10, null)])
                        ),
                        new(
                            "D",
                            RequirementStage.Approval,
                            WhenMet: new DateOnlyTimeline([H.DR(11, 20)])
                        ),
                        new("E", RequirementStage.Onboarding, WhenMet: null),
                        new("F", RequirementStage.Onboarding, WhenMet: null),
                    ]
                )
            );
        }

        [TestMethod]
        public void OldJsonRequirementWithoutIsRequiredDeserializesAsRequired()
        {
            var requirement = JsonConvert.DeserializeObject<VolunteerApprovalRequirement>(
                @"{""stage"":0,""actionName"":""Application""}"
            );

            Assert.IsNotNull(requirement);
            Assert.AreEqual(RequirementStage.Application, requirement!.Stage);
            Assert.AreEqual("Application", requirement.ActionName);
            Assert.IsNull(requirement.IsRequired);
        }

        [TestMethod]
        public void NullIsRequiredApplicationRequirementStillBlocksProspective()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "Application", null)
                ),
                completedRequirements: []
            );

            Assert.IsNull(result.Status);
            Assert.AreEqual(1, result.CurrentAvailableApplications.Count);
            Assert.AreEqual("Application", result.CurrentAvailableApplications.Single().ActionName);
        }

        [TestMethod]
        public void TrueIsRequiredApplicationRequirementStillBlocksProspective()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "Application", true)
                ),
                completedRequirements: []
            );

            Assert.IsNull(result.Status);
            Assert.AreEqual(1, result.CurrentAvailableApplications.Count);
            Assert.AreEqual("Application", result.CurrentAvailableApplications.Single().ActionName);
        }

        [TestMethod]
        public void OptionalApplicationRequirementDoesNotBlockProgression()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "OptionalApplication", false),
                    (RequirementStage.Approval, "Approval", true),
                    (RequirementStage.Onboarding, "Onboarding", true)
                ),
                completedRequirements: H.Completed(("Approval", 1), ("Onboarding", 2))
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(1, 1, RoleApprovalStatus.Approved),
                        H.DR(2, null, RoleApprovalStatus.Onboarded),
                    ]
                ),
                result.Status
            );
            Assert.AreEqual(0, result.CurrentAvailableApplications.Count);
        }

        [TestMethod]
        public void OptionalApprovalRequirementDoesNotBlockProgression()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "Application", true),
                    (RequirementStage.Approval, "OptionalApproval", false),
                    (RequirementStage.Onboarding, "Onboarding", true)
                ),
                completedRequirements: H.Completed(("Application", 1), ("Onboarding", 2))
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(1, 1, RoleApprovalStatus.Approved),
                        H.DR(2, null, RoleApprovalStatus.Onboarded),
                    ]
                ),
                result.Status
            );
            Assert.AreEqual(0, result.CurrentMissingRequirements.Count);
        }

        [TestMethod]
        public void OptionalOnboardingRequirementDoesNotBlockProgression()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "Application", true),
                    (RequirementStage.Approval, "Approval", true),
                    (RequirementStage.Onboarding, "OptionalOnboarding", false)
                ),
                completedRequirements: H.Completed(("Application", 1), ("Approval", 2))
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(1, 1, RoleApprovalStatus.Prospective),
                        H.DR(2, null, RoleApprovalStatus.Onboarded),
                    ]
                ),
                result.Status
            );
            Assert.AreEqual(0, result.CurrentMissingRequirements.Count);
        }

        [TestMethod]
        public void CompletedOptionalRequirementStillHasCompletionStatus()
        {
            var result = CalculateIndividualStatus(
                H.IndividualApprovalRequirementsWithRequired(
                    (RequirementStage.Application, "OptionalApplication", false)
                ),
                completedRequirements: H.Completed(("OptionalApplication", 3))
            );

            var requirement = result.Requirements.Single();
            Assert.AreEqual("OptionalApplication", requirement.ActionName);
            Assert.AreEqual(false, requirement.IsRequired);
            Assert.AreEqual(new DateOnlyTimeline([H.DR(3, null)]), requirement.WhenMet);
            Assert.IsNull(result.Status);
        }

        private static IndividualRoleVersionApprovalStatus CalculateIndividualStatus(
            ImmutableList<VolunteerApprovalRequirement> requirements,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements
        ) =>
            IndividualApprovalCalculations.CalculateIndividualRoleVersionApprovalStatus(
                locationPolicy: TestLocationPolicy,
                new VolunteerRolePolicy("Family Coach", []),
                new VolunteerRolePolicyVersion(
                    "v1",
                    SupersededAtUtc: null,
                    requirements
                ),
                completedRequirements,
                exemptedRequirements: [],
                removalsOfThisRole: []
            );
    }
}
