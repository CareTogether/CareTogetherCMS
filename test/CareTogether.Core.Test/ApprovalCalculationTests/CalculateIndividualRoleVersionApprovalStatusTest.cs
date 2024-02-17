using System;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateIndividualRoleVersionApprovalStatusTest
    {
        [TestMethod]
        public void WhenNoneCompleted()
        {
            // var result = IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
            //     requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
            //     policyVersionSupersededAtUtc: null,
            //     completedRequirements: [],
            //     exemptedRequirements: []
            // );

            // Assert.AreEqual(new IndividualRoleVersionApprovalStatus(
            //     ActionName: "A",
            //     Stage: RequirementStage.Approval,
            //     WhenMet: null),
            //     result);
            Assert.Inconclusive("Not implemented");
        }

        [TestMethod]
        public void WhenSomeCompleted()
        {
            // var result = IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
            //     requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
            //     policyVersionSupersededAtUtc: null,
            //     completedRequirements: [
            //         new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2,
            //             RequirementName: "A", CompletedAtUtc: H.DT(5), ExpiresAtUtc: H.DT(12),
            //             null, null),
            //         new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2,
            //             RequirementName: "B", CompletedAtUtc: H.DT(7), ExpiresAtUtc: null,
            //             null, null),
            //         new CompletedRequirementInfo(H.guid1, DateTime.Now, H.guid2,
            //             RequirementName: "A", CompletedAtUtc: H.DT(14), ExpiresAtUtc: null,
            //             null, null)
            //     ],
            //     exemptedRequirements: [
            //     ]
            // );

            // Assert.AreEqual(new IndividualRoleVersionApprovalStatus(
            //     ActionName: "A",
            //     Stage: RequirementStage.Approval,
            //     WhenMet: new DateOnlyTimeline([
            //         H.DR(5, 12),
            //         H.DR(14, null)
            //     ])),
            //     result);
            Assert.Inconclusive("Not implemented");
        }

        [TestMethod]
        public void WhenSomeExempted()
        {
            Assert.Inconclusive("Not implemented");
        }

        [TestMethod]
        public void WhenSomeCompletedAndSomeExempted()
        {
            Assert.Inconclusive("Not implemented");
        }
    }
}