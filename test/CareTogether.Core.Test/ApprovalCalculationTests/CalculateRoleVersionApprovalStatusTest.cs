using System;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests;

[TestClass]
public class CalculateRoleVersionApprovalStatusTest
{
    [TestMethod]
    public void EmptyInputsReturnsNull()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus([], []);

        Assert.IsNull(result);
    }

    [TestMethod]
    public void TestAllMetExceptApplicationReturnsNull()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Application, null),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(1, null)])),
            ],
            []
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void TestAllMetWithoutAnyApplicationRequirementsReturnsOnboarded()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(1, null)])),
            ],
            []
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([H.DR(1, null, RoleApprovalStatus.Onboarded)]));
    }

    [TestMethod]
    public void TestApplicationsMetWithoutAnyOtherRequirementsReturnsOnboardedRangesWithExpired()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(1, 5)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(1, 5)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(1, 5)])),
            ],
            []
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(
            result.Ranges.SequenceEqual(
                [H.DR(1, 5, RoleApprovalStatus.Onboarded), H.DR(6, null, RoleApprovalStatus.Expired)]
            )
        );
    }

    [TestMethod]
    public void TestApplicationsPartiallyAndFullyMetWithoutAnyOtherRequirementsReturnsProspectiveAndOnboardedRanges()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(1, null)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(1, 5), H.DR(10, 15)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(4, 12)])),
            ],
            []
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(
            result.Ranges.SequenceEqual(
                [
                    //NOTE: 1-3 are not prospective because *all* application requirements must be met to be prospective.
                    H.DR(4, 5, RoleApprovalStatus.Onboarded),
                    H.DR(6, 9, RoleApprovalStatus.Expired),
                    H.DR(10, 12, RoleApprovalStatus.Onboarded),
                    H.DR(13, null, RoleApprovalStatus.Expired),
                ]
            )
        );
    }

    [TestMethod]
    public void TestStatusSequence()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(4, null)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(6, null)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(8, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(7, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(8, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(10, 16), H.DR(18, 20)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(12, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(14, 24)])),
            ],
            []
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
    public void TestStatusSequenceWithRemovals()
    {
        var result = SharedCalculations.CalculateRoleVersionApprovalStatus(
            [
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(4, null)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(6, null)])),
                (RequirementStage.Application, new DateOnlyTimeline([H.DR(8, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(7, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(8, null)])),
                (RequirementStage.Approval, new DateOnlyTimeline([H.DR(10, 16), H.DR(18, 20)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(12, null)])),
                (RequirementStage.Onboarding, new DateOnlyTimeline([H.DR(14, 24)])),
            ],
            [
                new RoleRemoval("Irrelevant", RoleRemovalReason.Inactive, H.D(5), H.D(7), null),
                new RoleRemoval("Irrelevant", RoleRemovalReason.Denied, H.D(12), H.D(19), null),
                new RoleRemoval("Irrelevant", RoleRemovalReason.Inactive, H.D(23), null, null),
                new RoleRemoval("Irrelevant", RoleRemovalReason.Denied, H.D(25), null, null),
            ]
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(
            result.Ranges.SequenceEqual(
                [
                    H.DR(5, 7, RoleApprovalStatus.Inactive),
                    H.DR(8, 9, RoleApprovalStatus.Prospective),
                    H.DR(10, 11, RoleApprovalStatus.Approved),
                    H.DR(12, 19, RoleApprovalStatus.Denied),
                    H.DR(20, 20, RoleApprovalStatus.Onboarded),
                    H.DR(21, 22, RoleApprovalStatus.Expired),
                    H.DR(23, 24, RoleApprovalStatus.Inactive),
                    H.DR(25, null, RoleApprovalStatus.Denied),
                ]
            )
        );
    }
}
