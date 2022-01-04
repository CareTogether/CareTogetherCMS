using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateIndividualVolunteerRoleApprovalStatus
    {
        static ImmutableList<VolunteerApprovalRequirement> requirements =
            Helpers.IndividualApprovalRequirements(
                (RequirementStage.Application, "A"),
                (RequirementStage.Approval, "B"),
                (RequirementStage.Approval, "C"),
                (RequirementStage.Approval, "D"),
                (RequirementStage.Onboarding, "E"),
                (RequirementStage.Onboarding, "F"));


        [TestMethod]
        public void TestNotApplied()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(),
                Helpers.Exempted());

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
        }

        [TestMethod]
        public void TestNotAppliedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(),
                Helpers.Exempted());

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
        }

        [TestMethod]
        public void TestNotAppliedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(),
                Helpers.Exempted());

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications, "A");
        }

        [TestMethod]
        public void TestAppliedOnly()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestAppliedOnlyWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestAppliedOnlyHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 15)),
                Helpers.Exempted());

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            // Completing an application after the superseded date is not considered a valid completion for this policy version.
            // The superseded policy's requirements remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(availableApplications, "A");
        }

        [TestMethod]
        public void TestAppliedOnlyAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 15)),
                Helpers.Exempted());

            Assert.AreEqual(null, status);
            AssertEx.SequenceIs(missingRequirements);
            // Completing an application after the superseded date is not considered a valid completion for this policy version.
            // The superseded policy's requirements remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(availableApplications, "A");
        }

        [TestMethod]
        public void TestPartiallyApprovedOnly()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestPartiallyApprovedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestPartiallyApprovedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestPartiallyApprovedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 12), ("C", 13)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestPartiallyApprovedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 12), ("C", 13)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "B", "C", "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedOnly()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E", "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedOnlyByExemption()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3)),
                Helpers.Exempted(("D", 30)));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E", "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestNotApprovedBecauseExemptionExpired()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 10), ("F", 10)),
                Helpers.Exempted(("D", 15)));

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E", "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "E", "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 14)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestApprovedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 14)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Prospective, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "D");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedOnly()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedOnlyByExemption()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 5)),
                Helpers.Exempted(("D", null), ("F", 30)));

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestNotOnboardedBecauseExemptionExpired()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("E", 10)),
                Helpers.Exempted(("D", null), ("F", 10)));

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            AssertEx.SequenceIs(missingRequirements, "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 6)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
            AssertEx.SequenceIs(missingRequirements);
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedAfterSupersededDateWillBeSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 5),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 16)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "F");
            AssertEx.SequenceIs(availableApplications);
        }

        [TestMethod]
        public void TestOnboardedAfterSupersededDateHasBeenSuperseded()
        {
            var (status, missingRequirements, availableApplications) = ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                new VolunteerRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
                utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("A", 1), ("B", 2), ("C", 3), ("D", 4), ("E", 5), ("F", 16)),
                Helpers.Exempted());

            Assert.AreEqual(RoleApprovalStatus.Approved, status);
            // Requirements from superseded policies remain "available" for historical data entry purposes.
            AssertEx.SequenceIs(missingRequirements, "F");
            AssertEx.SequenceIs(availableApplications);
        }
    }
}
