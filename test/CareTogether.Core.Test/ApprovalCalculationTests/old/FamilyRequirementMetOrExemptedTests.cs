﻿using System;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class FamilyRequirementMetOrExemptedTests
    {
        // [TestMethod]
        // public void TestAllAdultsWithNoActiveAdults()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults());

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsWithNoActiveAdults()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults());

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyWithNoActiveAdults()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults());

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyWithNoActiveAdultsExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(("A", 1)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults());

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllAdultsRequirementMet()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllAdultsRequirementNotMet()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllAdultsRequirementNotMetByAnyAdults()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllAdultsRequirementMetAndExpiring()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 8), ("B", 1, 3)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, 7)), Helpers.Exempted()),
        //             (guid3, Helpers.CompletedWithExpiry(("A", 1, 9)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 7), result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllAdultsRequirementMetButExpired()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
        //         VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 4), ("B", 1, null)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, 3)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementNotMet()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetWithRoleRemoval()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles((guid2, "Role")),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetWithUnrelatedRoleRemoval()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles((guid2, "Other Role")),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetWithExemption()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10)))));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetAndExpiringWithExemption()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 2), ("B", 1, 4)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, null)), Helpers.Exempted(("B", 10))),
        //             (guid3, Helpers.CompletedWithExpiry(("A", 1, 20), ("B", 1, 5)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 4), result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetButExpiredWithExemption()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 8), ("B", 1, 4)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10)))));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMetWithExpiredExemption()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
        //         VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10)))));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementNotMet()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(("D", 1)),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMet()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "D",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(("D", 1)),
        //         Helpers.Exempted(),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMetExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(("D", 1)),
        //         Helpers.Exempted(("C", 10)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 10), result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMetExpiredExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(("D", 1)),
        //         Helpers.Exempted(("C", 10)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
        //             (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

        //     Assert.IsFalse(result.IsMetOrExempted);
        //     Assert.IsNull(result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMetAndExpiringBeforeExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.CompletedWithExpiry(("D", 1, 5)),
        //         Helpers.Exempted(("C", 10)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 4), ("B", 1, 4)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, 3)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 10), result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMetAndExpiringAfterExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
        //         Helpers.Completed(("D", 1)),
        //         Helpers.Exempted(("C", 10)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 14), ("B", 1, 14)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, 13)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 10), result.ExpiresAtUtc);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMetAndExpiredExemptionVariant()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
        //         VolunteerFamilyRequirementScope.OncePerFamily,
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
        //         Helpers.CompletedWithExpiry(("D", 1, 3)),
        //         Helpers.Exempted(("C", 10)),
        //         Helpers.RemovedIndividualRoles(),
        //         Helpers.ActiveAdults(
        //             (guid1, Helpers.CompletedWithExpiry(("A", 1, 3), ("B", 1, null)), Helpers.Exempted()),
        //             (guid2, Helpers.CompletedWithExpiry(("A", 1, null)), Helpers.Exempted())));

        //     Assert.IsTrue(result.IsMetOrExempted);
        //     Assert.AreEqual(new DateTime(2022, 1, 10), result.ExpiresAtUtc);
        // }
    }
}
