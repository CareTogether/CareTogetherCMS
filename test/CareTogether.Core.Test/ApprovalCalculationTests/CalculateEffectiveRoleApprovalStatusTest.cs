using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateEffectiveRoleApprovalStatusTest
    {
        [TestMethod]
        public void EmptyInputReturnsNull()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus([]);

            Assert.IsNull(result);
        }

        [TestMethod]
        public void NullInputsReturnsNull()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [null, null]
            );

            Assert.IsNull(result);
        }

        [TestMethod]
        public void SingleVersionApprovalReturnsItUnmodified()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(8, 9, RoleApprovalStatus.Prospective),
                            H.DR(10, 13, RoleApprovalStatus.Approved),
                            H.DR(14, 16, RoleApprovalStatus.Onboarded),
                            H.DR(17, 17, RoleApprovalStatus.Expired),
                            H.DR(18, 20, RoleApprovalStatus.Onboarded),
                            H.DR(21, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                ]
            );

            Assert.IsNotNull(result);
            Assert.IsTrue(
                result.Ranges.SequenceEqual(
                    [
                        H.DR(8, 9, RoleApprovalStatus.Prospective),
                        H.DR(10, 13, RoleApprovalStatus.Approved),
                        H.DR(14, 16, RoleApprovalStatus.Onboarded),
                        H.DR(17, 17, RoleApprovalStatus.Expired),
                        H.DR(18, 20, RoleApprovalStatus.Onboarded),
                        H.DR(21, null, RoleApprovalStatus.Expired),
                    ]
                )
            );
        }

        [TestMethod]
        public void SingleVersionApprovalWithNullsReturnsApprovalUnmodified()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(8, 9, RoleApprovalStatus.Prospective),
                            H.DR(10, 13, RoleApprovalStatus.Approved),
                            H.DR(14, 16, RoleApprovalStatus.Onboarded),
                            H.DR(17, 17, RoleApprovalStatus.Expired),
                            H.DR(18, 20, RoleApprovalStatus.Onboarded),
                            H.DR(21, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                    null,
                    null,
                ]
            );

            Assert.IsNotNull(result);
            Assert.IsTrue(
                result.Ranges.SequenceEqual(
                    [
                        H.DR(8, 9, RoleApprovalStatus.Prospective),
                        H.DR(10, 13, RoleApprovalStatus.Approved),
                        H.DR(14, 16, RoleApprovalStatus.Onboarded),
                        H.DR(17, 17, RoleApprovalStatus.Expired),
                        H.DR(18, 20, RoleApprovalStatus.Onboarded),
                        H.DR(21, null, RoleApprovalStatus.Expired),
                    ]
                )
            );
        }

        [TestMethod]
        public void ProspectiveTrumpsNullAndMerges()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [
                    new DateOnlyTimeline<RoleApprovalStatus>([H.DR(5, 10, RoleApprovalStatus.Prospective)]),
                    new DateOnlyTimeline<RoleApprovalStatus>([H.DR(11, 20, RoleApprovalStatus.Prospective)]),
                    null,
                ]
            );

            Assert.IsNotNull(result);
            Assert.IsTrue(result.Ranges.SequenceEqual([H.DR(5, 20, RoleApprovalStatus.Prospective)]));
        }

        [TestMethod]
        public void ApprovedTrumpsProspectiveAndExpiredAndNullAndMerges()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [
                    new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, 20, RoleApprovalStatus.Prospective)]),
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(10, 12, RoleApprovalStatus.Prospective),
                            H.DR(13, 25, RoleApprovalStatus.Approved),
                            H.DR(26, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [H.DR(11, 12, RoleApprovalStatus.Approved), H.DR(13, null, RoleApprovalStatus.Expired)]
                    ),
                    null,
                ]
            );

            Assert.IsNotNull(result);
            Assert.IsTrue(
                result.Ranges.SequenceEqual(
                    [
                        H.DR(1, 10, RoleApprovalStatus.Prospective),
                        H.DR(11, 25, RoleApprovalStatus.Approved),
                        H.DR(26, null, RoleApprovalStatus.Expired),
                    ]
                )
            );
        }

        [TestMethod]
        public void OnboardedTrumpsAllAndMerges()
        {
            DateOnlyTimeline<RoleApprovalStatus>? result = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                [
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(1, 4, RoleApprovalStatus.Prospective),
                            H.DR(5, 9, RoleApprovalStatus.Approved),
                            H.DR(10, 15, RoleApprovalStatus.Onboarded),
                            H.DR(16, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(10, 15, RoleApprovalStatus.Approved),
                            H.DR(16, 25, RoleApprovalStatus.Onboarded),
                            H.DR(26, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                    new DateOnlyTimeline<RoleApprovalStatus>(
                        [
                            H.DR(20, 27, RoleApprovalStatus.Prospective),
                            H.DR(28, 30, RoleApprovalStatus.Onboarded),
                            H.DR(31, null, RoleApprovalStatus.Expired),
                        ]
                    ),
                    null,
                ]
            );

            Assert.IsNotNull(result);
            Assert.IsTrue(
                result.Ranges.SequenceEqual(
                    [
                        H.DR(1, 4, RoleApprovalStatus.Prospective),
                        H.DR(5, 9, RoleApprovalStatus.Approved),
                        H.DR(10, 25, RoleApprovalStatus.Onboarded),
                        H.DR(26, 27, RoleApprovalStatus.Expired),
                        H.DR(28, 30, RoleApprovalStatus.Onboarded),
                        H.DR(31, null, RoleApprovalStatus.Expired),
                    ]
                )
            );
        }
    }
}
