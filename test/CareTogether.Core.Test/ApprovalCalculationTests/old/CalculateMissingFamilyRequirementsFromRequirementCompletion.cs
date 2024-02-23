using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateMissingFamilyRequirementsFromRequirementCompletion
    {
        // [TestMethod]
        // public void TestNoStatusNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: null,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestNoStatusAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: null,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestProspectiveNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Prospective,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestProspectiveAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Prospective,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

        //     AssertEx.SequenceIs(result, "B");
        // }

        // [TestMethod]
        // public void TestApprovedNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Approved,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestApprovedAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Approved,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

        //     AssertEx.SequenceIs(result, "E");
        // }

        // [TestMethod]
        // public void TestOnboardedNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Onboarded,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestOnboardedAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Onboarded,
        //         Helpers.FamilyRequirementsMet(
        //             ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
        //             ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
        //             ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
        //             ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

        //     AssertEx.SequenceIs(result);
        // }
    }
}
