using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateRoleApprovalStatusFromRequirementCompletions
    {
        // [TestMethod]
        // public void TestNotApplied()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     Assert.AreEqual((null, null), result);
        // }

        // [TestMethod]
        // public void TestNotAppliedWithAllOthersCompleted()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     Assert.AreEqual((null, null), result);
        // }

        // [TestMethod]
        // public void TestAppliedOnly()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     Assert.AreEqual((RoleApprovalStatus.Prospective, null), result);
        // }

        // [TestMethod]
        // public void TestPartiallyApproved()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     Assert.AreEqual((RoleApprovalStatus.Prospective, null), result);
        // }

        // [TestMethod]
        // public void TestApproved()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     Assert.AreEqual((RoleApprovalStatus.Approved, null), result);
        // }

        // [TestMethod]
        // public void TestPartiallyOnboarded()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, false)));

        //     Assert.AreEqual((RoleApprovalStatus.Approved, null), result);
        // }

        // [TestMethod]
        // public void TestFullyOnboarded()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMet(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     Assert.AreEqual((RoleApprovalStatus.Onboarded, null), result);
        // }

        // [TestMethod]
        // public void TestPartiallyOnboardedWithExpiry()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMetWithExpiry(
        //             ("A", RequirementStage.Application, true, null),
        //             ("B", RequirementStage.Approval, true, 7),
        //             ("C", RequirementStage.Approval, true, 14),
        //             ("D", RequirementStage.Approval, true, 10),
        //             ("E", RequirementStage.Onboarding, true, 5),
        //             ("F", RequirementStage.Onboarding, false, null)));

        //     Assert.AreEqual((RoleApprovalStatus.Approved, new DateTime(2022, 1, 7)), result);
        // }

        // [TestMethod]
        // public void TestFullyOnboardedWithExpiry()
        // {
        //     var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
        //         Helpers.IndividualRequirementsMetWithExpiry(
        //             ("A", RequirementStage.Application, true, null),
        //             ("B", RequirementStage.Approval, true, 7),
        //             ("C", RequirementStage.Approval, true, 14),
        //             ("D", RequirementStage.Approval, true, 10),
        //             ("E", RequirementStage.Onboarding, true, 5),
        //             ("F", RequirementStage.Onboarding, true, 12)));

        //     Assert.AreEqual((RoleApprovalStatus.Onboarded, new DateTime(2022, 1, 5)), result);
        // }
    }
}
