using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateRoleApprovalStatusFromRequirementCompletions
    {
        [TestMethod]
        public void TestNotApplied()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, false),
                    ("B", RequirementStage.Approval, false),
                    ("C", RequirementStage.Approval, false),
                    ("D", RequirementStage.Approval, false),
                    ("E", RequirementStage.Onboarding, false),
                    ("F", RequirementStage.Onboarding, false)));

            Assert.AreEqual(null, result);
        }

        [TestMethod]
        public void TestNotAppliedWithAllOthersCompleted()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, false),
                    ("B", RequirementStage.Approval, true),
                    ("C", RequirementStage.Approval, true),
                    ("D", RequirementStage.Approval, true),
                    ("E", RequirementStage.Onboarding, true),
                    ("F", RequirementStage.Onboarding, true)));

            Assert.AreEqual(null, result);
        }

        [TestMethod]
        public void TestAppliedOnly()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, true),
                    ("B", RequirementStage.Approval, false),
                    ("C", RequirementStage.Approval, false),
                    ("D", RequirementStage.Approval, false),
                    ("E", RequirementStage.Onboarding, false),
                    ("F", RequirementStage.Onboarding, false)));

            Assert.AreEqual(RoleApprovalStatus.Prospective, result);
        }

        [TestMethod]
        public void TestPartiallyApproved()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, true),
                    ("B", RequirementStage.Approval, true),
                    ("C", RequirementStage.Approval, true),
                    ("D", RequirementStage.Approval, false),
                    ("E", RequirementStage.Onboarding, false),
                    ("F", RequirementStage.Onboarding, false)));

            Assert.AreEqual(RoleApprovalStatus.Prospective, result);
        }

        [TestMethod]
        public void TestApproved()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, true),
                    ("B", RequirementStage.Approval, true),
                    ("C", RequirementStage.Approval, true),
                    ("D", RequirementStage.Approval, true),
                    ("E", RequirementStage.Onboarding, false),
                    ("F", RequirementStage.Onboarding, false)));

            Assert.AreEqual(RoleApprovalStatus.Approved, result);
        }

        [TestMethod]
        public void TestPartiallyOnboarded()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, true),
                    ("B", RequirementStage.Approval, true),
                    ("C", RequirementStage.Approval, true),
                    ("D", RequirementStage.Approval, true),
                    ("E", RequirementStage.Onboarding, true),
                    ("F", RequirementStage.Onboarding, false)));

            Assert.AreEqual(RoleApprovalStatus.Approved, result);
        }

        [TestMethod]
        public void TestFullyOnboarded()
        {
            var result = ApprovalCalculations.CalculateRoleApprovalStatusFromRequirementCompletions(
                Helpers.IndividualRequirementsMet(
                    ("A", RequirementStage.Application, true),
                    ("B", RequirementStage.Approval, true),
                    ("C", RequirementStage.Approval, true),
                    ("D", RequirementStage.Approval, true),
                    ("E", RequirementStage.Onboarding, true),
                    ("F", RequirementStage.Onboarding, true)));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, result);
        }
    }
}
