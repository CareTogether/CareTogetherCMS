using System;
using System.Collections.Immutable;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateFamilyVolunteerRoleApprovalStatus
    {
        // [TestMethod]
        // public void TestNotApplied()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(null, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications, "A");
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestNotAppliedWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(null, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications, "A");
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestNotAppliedHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(null, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications, "A");
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestAppliedOnly()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "C", "D" }),
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestAppliedOnlyWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "C", "D" }),
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestAppliedOnlyHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "C", "D" }),
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestAppliedOnlyAfterSupersededDateWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 15)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(null, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     // Completing an application after the superseded date is not considered a valid completion for this policy version.
        //     // The superseded policy's requirements remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(availableApplications, "A");
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestAppliedOnlyAfterSupersededDateHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 15)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(null, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     // Completing an application after the superseded date is not considered a valid completion for this policy version.
        //     // The superseded policy's requirements remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(availableApplications, "A");
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestPartiallyApprovedOnly()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }));
        // }

        // [TestMethod]
        // public void TestPartiallyApprovedWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }));
        // }

        // [TestMethod]
        // public void TestPartiallyApprovedHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }));
        // }

        // [TestMethod]
        // public void TestPartiallyApprovedAfterSupersededDateWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 12)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 13)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }),
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestPartiallyApprovedAfterSupersededDateHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 12)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid2, "C", 13)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }),
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestApprovedOnly()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestNotApprovedOnlyWithoutRemovedRole()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles());

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid2, new string[] { "D" }));
        // }

        // [TestMethod]
        // public void TestApprovedOnlyWithoutRemovedRole()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid2, "D", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles());

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }),
        //         (guid2, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestApprovedOnlyByExemption()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(("B", 30)),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(new DateTime(2022, 1, 30), expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestApprovedOnlyByExemptionExpiring()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.CompletedWithExpiry(("A", 1, 28)),
        //         Helpers.Exempted(("B", 30)),
        //         Helpers.CompletedIndividualRequirementsWithExpiry((guid1, "C", 3, 29), (guid1, "D", 4, null)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(new DateTime(2022, 1, 28), expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestApprovedOnlyByExemptionExpiringEarlierIndividual()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.CompletedWithExpiry(("A", 1, 28)),
        //         Helpers.Exempted(("B", 30)),
        //         Helpers.CompletedIndividualRequirementsWithExpiry((guid1, "C", 3, 26), (guid1, "D", 4, null)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(new DateTime(2022, 1, 26), expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestNotApprovedBecauseExemptionExpired()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(("B", 15)),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestNotApprovedBecauseExemptionExpiredExpired()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.CompletedWithExpiry(("A", 1, null)),
        //         Helpers.Exempted(("B", 15)),
        //         Helpers.CompletedIndividualRequirementsWithExpiry((guid1, "C", 3, 17), (guid1, "D", 4, 21)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestNotApprovedBecauseIndividualExemptionExpired()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(("B", 30)),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4)),
        //         Helpers.ExemptedIndividualRequirements((guid2, "C", 15)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid2, new string[] { "C" }));
        // }

        // [TestMethod]
        // public void TestApprovedWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestApprovedHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestApprovedAfterSupersededDateWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 12)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestApprovedIndividualAfterSupersededDateWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 14), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "D" }));
        // }

        // [TestMethod]
        // public void TestApprovedAfterSupersededDateHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 12)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Prospective, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "B");
        //     AssertEx.SequenceIs(availableApplications);
        // }

        // [TestMethod]
        // public void TestOnboardedOnly()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestOnboardedOnlyByExemption()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(("E", null)),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements((guid1, "F", 30)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //     Assert.AreEqual(new DateTime(2022, 1, 30), expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestNotOnboardedBecauseExemptionExpired()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: null, requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2)),
        //         Helpers.Exempted(("E", null)),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3)),
        //         Helpers.ExemptedIndividualRequirements((guid1, "F", 10)),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements,
        //         (guid1, new string[] { "F" }));
        // }

        // [TestMethod]
        // public void TestOnboardedWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestOnboardedHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2), ("E", 4)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Onboarded, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     AssertEx.SequenceIs(missingRequirements);
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestOnboardedAfterSupersededDateWillBeSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 5), family,
        //         Helpers.Completed(("A", 1), ("B", 2), ("E", 14)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }

        // [TestMethod]
        // public void TestOnboardedAfterSupersededDateHasBeenSuperseded()
        // {
        //     var (status, expiresAtUtc, missingRequirements, availableApplications, missingIndividualRequirements) =
        //         ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus("Role",
        //         new VolunteerFamilyRolePolicyVersion("v1", SupersededAtUtc: new DateTime(2022, 1, 10), requirements),
        //         utcNow: new DateTime(2022, 1, 20), family,
        //         Helpers.Completed(("A", 1), ("B", 2), ("E", 14)),
        //         Helpers.Exempted(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 3), (guid1, "D", 4), (guid2, "C", 3), (guid1, "F", 4)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")));

        //     Assert.AreEqual(RoleApprovalStatus.Approved, status);
        //     Assert.AreEqual(null, expiresAtUtc);
        //     // Requirements from superseded policies remain "available" for historical data entry purposes.
        //     AssertEx.SequenceIs(missingRequirements, "E");
        //     AssertEx.SequenceIs(availableApplications);
        //     AssertEx.DictionaryIs(missingIndividualRequirements);
        // }
    }
}
