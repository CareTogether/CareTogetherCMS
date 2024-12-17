using System;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class FamilyRequirementMissingForIndividualsTests
    {
        // [TestMethod]
        // public void TestAllAdultsRequirementMissingForIndividualsWhereNotCompletedOrExemptionExpired()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMissingForIndividuals("Tester",
        //         new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.AllAdultsInTheFamily),
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         removedIndividualRoles:
        //             Helpers.RemovedIndividualRoles((guid1, "Tester")),
        //         activeAdults:
        //             Helpers.ActiveAdults(
        //                 (guid0, Helpers.Completed(("A", 1), ("B", 2)), Helpers.Exempted(("C", 10))),
        //                 (guid1, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10))),
        //                 (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 30))),
        //                 (guid3, Helpers.Completed(("A", 1), ("B", 4), ("B", 8)), Helpers.Exempted())));

        //     AssertEx.SequenceIs(result, guid1);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMissingForIndividualsWhereOptedOut()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMissingForIndividuals("Tester",
        //         new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         removedIndividualRoles:
        //             Helpers.RemovedIndividualRoles((guid1, "Tester")),
        //         activeAdults:
        //             Helpers.ActiveAdults(
        //                 (guid0, Helpers.Completed(("A", 1), ("B", 2)), Helpers.Exempted(("C", 10))),
        //                 (guid1, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10))),
        //                 (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 30))),
        //                 (guid3, Helpers.Completed(("A", 1), ("B", 4), ("B", 8)), Helpers.Exempted())));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestAllParticipatingAdultsRequirementMissingForIndividualsWhereNotOptedOut()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMissingForIndividuals("Tester",
        //         new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily),
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         removedIndividualRoles:
        //             Helpers.RemovedIndividualRoles(),
        //         activeAdults:
        //             Helpers.ActiveAdults(
        //                 (guid0, Helpers.Completed(("A", 1), ("B", 2)), Helpers.Exempted(("C", 10))),
        //                 (guid1, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10))),
        //                 (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 30))),
        //                 (guid3, Helpers.Completed(("A", 1), ("B", 4), ("B", 8)), Helpers.Exempted())));

        //     AssertEx.SequenceIs(result, guid1);
        // }

        // [TestMethod]
        // public void TestOncePerFamilyRequirementMissingForIndividualsIsAlwaysAnEmptyList()
        // {
        //     var result = ApprovalCalculations.FamilyRequirementMissingForIndividuals("Tester",
        //         new VolunteerFamilyApprovalRequirement(RequirementStage.Approval, "B", VolunteerFamilyRequirementScope.OncePerFamily),
        //         supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
        //         removedIndividualRoles:
        //             Helpers.RemovedIndividualRoles(),
        //         activeAdults:
        //             Helpers.ActiveAdults(
        //                 (guid0, Helpers.Completed(("A", 1), ("B", 2)), Helpers.Exempted(("C", 10))),
        //                 (guid1, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10))),
        //                 (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 30))),
        //                 (guid3, Helpers.Completed(("A", 1), ("B", 4), ("B", 8)), Helpers.Exempted())));

        //     AssertEx.SequenceIs(result);
        // }
    }
}
