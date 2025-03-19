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
    public class CalculateIndividualRoleRequirementCompletionStatusTest
    {
        [TestMethod]
        public void WhenNoneCompleted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    policyVersionSupersededAtUtc: null,
                    completedRequirements: [],
                    exemptedRequirements: []
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    ActionName: "A",
                    Stage: RequirementStage.Approval,
                    WhenMet: null
                ),
                result
            );
        }

        [TestMethod]
        public void WhenSomeCompleted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    policyVersionSupersededAtUtc: null,
                    completedRequirements:
                    [
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid2,
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
                            H.guid2,
                            RequirementName: "A",
                            CompletedAtUtc: H.DT(14),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                    ],
                    exemptedRequirements: []
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    ActionName: "A",
                    Stage: RequirementStage.Approval,
                    WhenMet: new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                ),
                result
            );
        }

        [TestMethod]
        public void WhenSomeExempted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    policyVersionSupersededAtUtc: null,
                    completedRequirements: [],
                    exemptedRequirements:
                    [
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(5),
                            RequirementName: "A",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: H.DT(12)
                        ),
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(7),
                            RequirementName: "B",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: null
                        ),
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(15),
                            RequirementName: "A",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: null
                        ),
                    ]
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    ActionName: "A",
                    Stage: RequirementStage.Approval,
                    WhenMet: new DateOnlyTimeline([H.DR(5, 12), H.DR(15, null)])
                ),
                result
            );
        }

        [TestMethod]
        public void WhenSomeCompletedAndSomeExempted()
        {
            var result =
                IndividualApprovalCalculations.CalculateIndividualRoleRequirementCompletionStatus(
                    requirement: new VolunteerApprovalRequirement(RequirementStage.Approval, "A"),
                    policyVersionSupersededAtUtc: null,
                    completedRequirements:
                    [
                        new Resources.CompletedRequirementInfo(
                            H.guid1,
                            DateTime.Now,
                            H.guid2,
                            RequirementName: "A",
                            CompletedAtUtc: H.DT(10),
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
                            H.guid2,
                            RequirementName: "A",
                            CompletedAtUtc: H.DT(14),
                            ExpiresAtUtc: null,
                            null,
                            null
                        ),
                    ],
                    exemptedRequirements:
                    [
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(5),
                            RequirementName: "A",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: H.DT(9)
                        ),
                        new Resources.ExemptedRequirementInfo(
                            H.guid1,
                            TimestampUtc: H.DT(7),
                            RequirementName: "B",
                            DueDate: null,
                            AdditionalComments: "",
                            ExemptionExpiresAtUtc: null
                        ),
                    ]
                );

            Assert.AreEqual(
                new IndividualRoleRequirementCompletionStatus(
                    ActionName: "A",
                    Stage: RequirementStage.Approval,
                    WhenMet: new DateOnlyTimeline([H.DR(5, 12), H.DR(14, null)])
                ),
                result
            );
        }
    }
}
