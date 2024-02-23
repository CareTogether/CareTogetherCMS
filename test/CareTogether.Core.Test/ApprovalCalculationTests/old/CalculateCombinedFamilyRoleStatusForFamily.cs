using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateCombinedFamilyRoleStatusForFamily
    {
        // [TestMethod]
        // public void TestNotApplied()
        // {
        //     var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
        //         volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(),
        //         Helpers.Exempted(),
        //         Helpers.Removed(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles());

        //     AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals);
        //     AssertEx.SequenceIs(result.AvailableFamilyApplications, "A", "Acoach", "Aold");
        //     AssertEx.SequenceIs(result.RemovedFamilyRoles);
        //     AssertEx.SequenceIs(result.MissingFamilyRequirements);
        //     AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles);
        // }

        // [TestMethod]
        // public void TestAppliedOnly()
        // {
        //     var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
        //         volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(("A", 1)),
        //         Helpers.Exempted(),
        //         Helpers.Removed(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Host")));

        //     AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
        //         ("Host", new RoleVersionApproval[] {
        //             new ("v1", RoleApprovalStatus.Prospective, null),
        //             new ("v2", RoleApprovalStatus.Prospective, null) }));
        //     AssertEx.SequenceIs(result.AvailableFamilyApplications, "Acoach", "Aold");
        //     AssertEx.SequenceIs(result.RemovedFamilyRoles);
        //     AssertEx.SequenceIs(result.MissingFamilyRequirements, "B");
        //     AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
        //         (guid1, new [] { "C", "D", "Dv2" }),
        //         (guid2, new [] { "D", "Dv2" } ));
        // }

        // [TestMethod]
        // public void TestAppliedToMultipleRoles()
        // {
        //     var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
        //         volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(("A", 1), ("Acoach", 1)),
        //         Helpers.Exempted(),
        //         Helpers.Removed(),
        //         Helpers.CompletedIndividualRequirements(),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Host")));

        //     AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
        //         ("Host", new RoleVersionApproval[] {
        //             new ("v1", RoleApprovalStatus.Prospective, null),
        //             new ("v2", RoleApprovalStatus.Prospective, null) }),
        //         ("Coach", new RoleVersionApproval[] {
        //             new ("v1", RoleApprovalStatus.Prospective, null) }));
        //     AssertEx.SequenceIs(result.AvailableFamilyApplications, "Aold");
        //     AssertEx.SequenceIs(result.RemovedFamilyRoles);
        //     AssertEx.SequenceIs(result.MissingFamilyRequirements, "B");
        //     AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
        //         (guid1, new[] { "C", "D", "Dv2", "Ccoach" }),
        //         (guid2, new[] { "D", "Dv2", "Ccoach" }));
        // }

        // [TestMethod]
        // public void TestApprovedForOneVersionOnly()
        // {
        //     var result = ApprovalCalculations.CalculateCombinedFamilyRoleStatusForFamily(
        //         volunteerPolicy, family, utcNow: new DateTime(2022, 1, 20),
        //         Helpers.Completed(("A", 1), ("Acoach", 1), ("B", 4)),
        //         Helpers.Exempted(),
        //         Helpers.Removed(),
        //         Helpers.CompletedIndividualRequirements((guid1, "C", 2), (guid1, "Dv2", 2), (guid2, "Dv2", 2), (guid2, "Ccoach", 5)),
        //         Helpers.ExemptedIndividualRequirements(),
        //         Helpers.RemovedIndividualRoles((guid2, "Host")));

        //     AssertEx.DictionaryIs(result.FamilyRoleVersionApprovals,
        //         ("Host", new RoleVersionApproval[] {
        //             new ("v1", RoleApprovalStatus.Prospective, null),
        //             new ("v2", RoleApprovalStatus.Approved, null) }),
        //         ("Coach", new RoleVersionApproval[] {
        //             new ("v1", RoleApprovalStatus.Prospective, null) }));
        //     AssertEx.SequenceIs(result.AvailableFamilyApplications, "Aold");
        //     AssertEx.SequenceIs(result.RemovedFamilyRoles);
        //     AssertEx.SequenceIs(result.MissingFamilyRequirements, "F");
        //     AssertEx.DictionaryIs(result.MissingIndividualRequirementsForFamilyRoles,
        //         (guid1, new[] { "D", "Ccoach", "E" }),
        //         (guid2, new[] { "D" }));
        // }
    }
}
