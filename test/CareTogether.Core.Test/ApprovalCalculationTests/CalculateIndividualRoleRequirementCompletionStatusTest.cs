using System;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using CompletedRequirementInfo = CareTogether.Resources.CompletedRequirementInfo;
using ExemptedRequirementInfo = CareTogether.Resources.ExemptedRequirementInfo;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateIndividualRoleRequirementCompletionStatusTest
    {
        [TestMethod]
        public void WhenNoneCompleted()
        {
            IndividualRoleRequirementCompletionStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    null,
                    [],
                    []
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus("A", RequirementStage.Approval, null),
                result
            );
        }

        [TestMethod]
        public void WhenSomeCompleted()
        {
            IndividualRoleRequirementCompletionStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    null,
                    [
                        new CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid2,
                            "A",
                            H.DT(5),
                            H.DT(12),
                            null,
                            null
                        ),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2, "B", H.DT(7), null, null, null),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2, "A", H.DT(14), null, null, null),
                    ],
                    []
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    "A",
                    RequirementStage.Approval,
                    new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                ),
                result
            );
        }

        [TestMethod]
        public void WhenSomeExempted()
        {
            IndividualRoleRequirementCompletionStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    null,
                    [],
                    [
                        new ExemptedRequirementInfo(H.guid1, H.DT(5), "A", null, "", H.DT(12)),
                        new ExemptedRequirementInfo(H.guid1, H.DT(7), "B", null, "", null),
                        new ExemptedRequirementInfo(H.guid1, H.DT(15), "A", null, "", null),
                    ]
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    "A",
                    RequirementStage.Approval,
                    new DateOnlyTimeline([H.DR(5, 12), H.DR(15, null)])
                ),
                result
            );
        }

        [TestMethod]
        public void WhenSomeCompletedAndSomeExempted()
        {
            IndividualRoleRequirementCompletionStatus result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    null,
                    [
                        new CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid2,
                            "A",
                            H.DT(10),
                            H.DT(12),
                            null,
                            null
                        ),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2, "B", H.DT(7), null, null, null),
                        new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2, "A", H.DT(14), null, null, null),
                    ],
                    [
                        new ExemptedRequirementInfo(H.guid1, H.DT(5), "A", null, "", H.DT(9)),
                        new ExemptedRequirementInfo(H.guid1, H.DT(7), "B", null, "", null),
                    ]
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    "A",
                    RequirementStage.Approval,
                    new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                ),
                result
            );
        }
    }
}
