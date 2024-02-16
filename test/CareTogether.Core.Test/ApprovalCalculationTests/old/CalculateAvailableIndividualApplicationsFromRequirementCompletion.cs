using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateAvailableIndividualApplicationsFromRequirementCompletion
    {
        // [TestMethod]
        // public void TestNoStatusNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: null,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestNoStatusAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: null,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     AssertEx.SequenceIs(result, "A");
        // }

        // [TestMethod]
        // public void TestProspectiveNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Prospective,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestProspectiveAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Prospective,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestApprovedNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Approved,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestApprovedAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Approved,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestOnboardedNoneMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Onboarded,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, true),
        //             ("B", RequirementStage.Approval, true),
        //             ("C", RequirementStage.Approval, true),
        //             ("D", RequirementStage.Approval, true),
        //             ("E", RequirementStage.Onboarding, true),
        //             ("F", RequirementStage.Onboarding, true)));

        //     AssertEx.SequenceIs(result);
        // }

        // [TestMethod]
        // public void TestOnboardedAllMissing()
        // {
        //     var result = ApprovalCalculations.CalculateAvailableIndividualApplicationsFromRequirementCompletion(
        //         status: RoleApprovalStatus.Onboarded,
        //         Helpers.IndividualRequirementsMetSimple(
        //             ("A", RequirementStage.Application, false),
        //             ("B", RequirementStage.Approval, false),
        //             ("C", RequirementStage.Approval, false),
        //             ("D", RequirementStage.Approval, false),
        //             ("E", RequirementStage.Onboarding, false),
        //             ("F", RequirementStage.Onboarding, false)));

        //     AssertEx.SequenceIs(result);
        // }
    }
}
