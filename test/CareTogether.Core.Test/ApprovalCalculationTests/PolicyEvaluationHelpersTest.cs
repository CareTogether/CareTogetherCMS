using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class PolicyEvaluationHelpersTest
    {
        [TestClass]
        public class GetMaxRoleStatusIndividualTests
        {
            private static IndividualRoleVersionApprovalStatus CreateIndividualVersion(
                string version,
                RoleApprovalStatus? status
            )
            {
                var timeline = status.HasValue
                    ? new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, null, status.Value)])
                    : null;

                return new IndividualRoleVersionApprovalStatus(
                    "TestRole",
                    version,
                    timeline,
                    ImmutableList<IndividualRoleRequirementCompletionStatus>.Empty
                );
            }

            [TestMethod]
            public void EmptyList_ReturnsDefault()
            {
                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(
                    ImmutableList<IndividualRoleVersionApprovalStatus>.Empty
                );

                Assert.AreEqual((RoleApprovalStatus)0, result);
            }

            [TestMethod]
            public void AllNullStatuses_ReturnsDefault()
            {
                var versions = ImmutableList.Create(
                    CreateIndividualVersion("v1", null),
                    CreateIndividualVersion("v2", null)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual((RoleApprovalStatus)0, result);
            }

            [DataTestMethod]
            [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective)]
            [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Approved)]
            [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
            [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired)]
            [DataRow(RoleApprovalStatus.Inactive, RoleApprovalStatus.Inactive)]
            [DataRow(RoleApprovalStatus.Denied, RoleApprovalStatus.Denied)]
            public void SingleStatus_ReturnsTheStatus(
                RoleApprovalStatus inputStatus,
                RoleApprovalStatus expectedStatus
            )
            {
                var versions = ImmutableList.Create(CreateIndividualVersion("v1", inputStatus));

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(expectedStatus, result);
            }

            [DataTestMethod]
            [DataRow(
                RoleApprovalStatus.Prospective,
                RoleApprovalStatus.Expired,
                RoleApprovalStatus.Expired
            )]
            [DataRow(
                RoleApprovalStatus.Expired,
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Approved
            )]
            [DataRow(
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Onboarded,
                RoleApprovalStatus.Onboarded
            )]
            [DataRow(
                RoleApprovalStatus.Onboarded,
                RoleApprovalStatus.Inactive,
                RoleApprovalStatus.Inactive
            )]
            [DataRow(
                RoleApprovalStatus.Inactive,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            [DataRow(
                RoleApprovalStatus.Prospective,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            [DataRow(
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            public void TwoStatuses_ReturnsHigher(
                RoleApprovalStatus status1,
                RoleApprovalStatus status2,
                RoleApprovalStatus expected
            )
            {
                var versions = ImmutableList.Create(
                    CreateIndividualVersion("v1", status1),
                    CreateIndividualVersion("v2", status2)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(expected, result);
            }

            [TestMethod]
            public void DeniedTrumpsAll()
            {
                var versions = ImmutableList.Create(
                    CreateIndividualVersion("v1", RoleApprovalStatus.Prospective),
                    CreateIndividualVersion("v2", RoleApprovalStatus.Approved),
                    CreateIndividualVersion("v3", RoleApprovalStatus.Onboarded),
                    CreateIndividualVersion("v4", RoleApprovalStatus.Expired),
                    CreateIndividualVersion("v5", RoleApprovalStatus.Denied)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(RoleApprovalStatus.Denied, result);
            }

            [TestMethod]
            public void MixedWithNulls_ReturnsHighestNonNull()
            {
                var versions = ImmutableList.Create(
                    CreateIndividualVersion("v1", null),
                    CreateIndividualVersion("v2", RoleApprovalStatus.Approved),
                    CreateIndividualVersion("v3", null)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(RoleApprovalStatus.Approved, result);
            }
        }

        [TestClass]
        public class GetMaxRoleStatusFamilyTests
        {
            private static FamilyRoleVersionApprovalStatus CreateFamilyVersion(
                string version,
                RoleApprovalStatus? status
            )
            {
                var timeline = status.HasValue
                    ? new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, null, status.Value)])
                    : null;

                return new FamilyRoleVersionApprovalStatus(
                    "TestRole",
                    version,
                    timeline,
                    ImmutableList<FamilyRoleRequirementCompletionStatus>.Empty
                );
            }

            [TestMethod]
            public void EmptyList_ReturnsDefault()
            {
                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(
                    ImmutableList<FamilyRoleVersionApprovalStatus>.Empty
                );

                Assert.AreEqual((RoleApprovalStatus)0, result);
            }

            [TestMethod]
            public void AllNullStatuses_ReturnsDefault()
            {
                var versions = ImmutableList.Create(
                    CreateFamilyVersion("v1", null),
                    CreateFamilyVersion("v2", null)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual((RoleApprovalStatus)0, result);
            }

            [DataTestMethod]
            [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective)]
            [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Approved)]
            [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
            [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired)]
            [DataRow(RoleApprovalStatus.Inactive, RoleApprovalStatus.Inactive)]
            [DataRow(RoleApprovalStatus.Denied, RoleApprovalStatus.Denied)]
            public void SingleStatus_ReturnsTheStatus(
                RoleApprovalStatus inputStatus,
                RoleApprovalStatus expectedStatus
            )
            {
                var versions = ImmutableList.Create(CreateFamilyVersion("v1", inputStatus));

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(expectedStatus, result);
            }

            [DataTestMethod]
            [DataRow(
                RoleApprovalStatus.Prospective,
                RoleApprovalStatus.Expired,
                RoleApprovalStatus.Expired
            )]
            [DataRow(
                RoleApprovalStatus.Expired,
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Approved
            )]
            [DataRow(
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Onboarded,
                RoleApprovalStatus.Onboarded
            )]
            [DataRow(
                RoleApprovalStatus.Onboarded,
                RoleApprovalStatus.Inactive,
                RoleApprovalStatus.Inactive
            )]
            [DataRow(
                RoleApprovalStatus.Inactive,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            [DataRow(
                RoleApprovalStatus.Prospective,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            [DataRow(
                RoleApprovalStatus.Approved,
                RoleApprovalStatus.Denied,
                RoleApprovalStatus.Denied
            )]
            public void TwoStatuses_ReturnsHigher(
                RoleApprovalStatus status1,
                RoleApprovalStatus status2,
                RoleApprovalStatus expected
            )
            {
                var versions = ImmutableList.Create(
                    CreateFamilyVersion("v1", status1),
                    CreateFamilyVersion("v2", status2)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(expected, result);
            }

            [TestMethod]
            public void DeniedTrumpsAll()
            {
                var versions = ImmutableList.Create(
                    CreateFamilyVersion("v1", RoleApprovalStatus.Prospective),
                    CreateFamilyVersion("v2", RoleApprovalStatus.Approved),
                    CreateFamilyVersion("v3", RoleApprovalStatus.Onboarded),
                    CreateFamilyVersion("v4", RoleApprovalStatus.Expired),
                    CreateFamilyVersion("v5", RoleApprovalStatus.Denied)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(RoleApprovalStatus.Denied, result);
            }

            [TestMethod]
            public void MixedWithNulls_ReturnsHighestNonNull()
            {
                var versions = ImmutableList.Create(
                    CreateFamilyVersion("v1", null),
                    CreateFamilyVersion("v2", RoleApprovalStatus.Approved),
                    CreateFamilyVersion("v3", null)
                );

                var result = PolicyEvaluationHelpers.GetMaxRoleStatus(versions);

                Assert.AreEqual(RoleApprovalStatus.Approved, result);
            }
        }
    }
}
