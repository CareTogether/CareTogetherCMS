using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateAvailableFamilyApplicationsFromRequirementCompletion
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');


        [TestMethod]
        public void TestNoStatusNoneMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: null,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestNoStatusAllMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: null,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

            AssertEx.SequenceIs(result, "A");
        }

        [TestMethod]
        public void TestProspectiveNoneMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Prospective,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestProspectiveAllMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Prospective,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestApprovedNoneMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Approved,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestApprovedAllMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Approved,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestOnboardedNoneMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Onboarded,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestOnboardedAllMissing()
        {
            var result = ApprovalCalculations.CalculateAvailableFamilyApplicationsFromRequirementCompletion(
                status: RoleApprovalStatus.Onboarded,
                Helpers.FamilyRequirementsMet(
                    ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, false, new List<Guid>() { guid1, guid2 }),
                    ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 }),
                    ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, false, new List<Guid>() { }),
                    ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, false, new List<Guid>() { guid1 })));

            AssertEx.SequenceIs(result);
        }
    }
}
