using System;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using CompletedRequirementInfo = CareTogether.Resources.CompletedRequirementInfo;
using ExemptedRequirementInfo = CareTogether.Resources.ExemptedRequirementInfo;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateIndividualRoleVersionApprovalStatusTest
    {
        [TestMethod]
        public void WhenNoneCompleted()
        {
            IndividualRoleVersionApprovalStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleVersionApprovalStatus(
                    new VolunteerRolePolicyVersion(
                        "v1",
                        H.DT(20),
                        H.IndividualApprovalRequirements(
                            (RequirementStage.Application, "A"),
                            (RequirementStage.Approval, "B"),
                            (RequirementStage.Approval, "C"),
                            (RequirementStage.Approval, "D"),
                            (RequirementStage.Onboarding, "E"),
                            (RequirementStage.Onboarding, "F")
                        )
                    ),
                    [],
                    [],
                    []
                );

            Assert.AreEqual("v1", result.Version);
            Assert.AreEqual(null, result.Status);
            Assert.IsTrue(
                result.Requirements.SequenceEqual(
                    [
                        new IndividualRoleRequirementCompletionStatus("A", RequirementStage.Application, null),
                        new IndividualRoleRequirementCompletionStatus("B", RequirementStage.Approval, null),
                        new IndividualRoleRequirementCompletionStatus("C", RequirementStage.Approval, null),
                        new IndividualRoleRequirementCompletionStatus("D", RequirementStage.Approval, null),
                        new IndividualRoleRequirementCompletionStatus("E", RequirementStage.Onboarding, null),
                        new IndividualRoleRequirementCompletionStatus("F", RequirementStage.Onboarding, null),
                    ]
                )
            );
        }

        [TestMethod]
        public void WhenSomeCompletedAndSomeExempted()
        {
            IndividualRoleVersionApprovalStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleVersionApprovalStatus(
                    new VolunteerRolePolicyVersion(
                        "v1",
                        H.DT(20),
                        H.IndividualApprovalRequirements(
                            (RequirementStage.Application, "A"),
                            (RequirementStage.Approval, "B"),
                            (RequirementStage.Approval, "C"),
                            (RequirementStage.Approval, "D"),
                            (RequirementStage.Onboarding, "E"),
                            (RequirementStage.Onboarding, "F")
                        )
                    ),
                    [
                        new CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid1,
                            "A",
                            H.DT(5),
                            H.DT(12),
                            null,
                            null
                        ),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2, "B", H.DT(7), null, null, null),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid3, "A", H.DT(14), null, null, null),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid4, "C", H.DT(10), null, null, null),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid5, "E", H.DT(25), null, null, null),
                    ],
                    [new ExemptedRequirementInfo(H.guid1, H.DT(11), "D", null, "", H.DT(20))],
                    [
                        new RoleRemoval("Irrelevant", RoleRemovalReason.Denied, H.D(16), H.D(17), null),
                        new RoleRemoval("Irrelevant", RoleRemovalReason.Inactive, H.D(23), null, null),
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
                        new IndividualRoleRequirementCompletionStatus(
                            "A",
                            RequirementStage.Application,
                            new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                        ),
                        new IndividualRoleRequirementCompletionStatus(
                            "B",
                            RequirementStage.Approval,
                            new DateOnlyTimeline([H.DR(7, null)])
                        ),
                        new IndividualRoleRequirementCompletionStatus(
                            "C",
                            RequirementStage.Approval,
                            new DateOnlyTimeline([H.DR(10, null)])
                        ),
                        new IndividualRoleRequirementCompletionStatus(
                            "D",
                            RequirementStage.Approval,
                            new DateOnlyTimeline([H.DR(11, 20)])
                        ),
                        new IndividualRoleRequirementCompletionStatus("E", RequirementStage.Onboarding, null),
                        new IndividualRoleRequirementCompletionStatus("F", RequirementStage.Onboarding, null),
                    ]
                )
            );
        }
    }
}
