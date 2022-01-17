using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class SelectMissingRequirements
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
        public void Test()
        {
            Assert.Inconclusive("Not implemented");
            //var result = ApprovalCalculations.CalculateMissingFamilyRequirementsFromRequirementCompletion(
            //    status: null,
            //    Helpers.FamilyRequirementsMet(
            //        ("A", RequirementStage.Application, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
            //        ("B", RequirementStage.Approval, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
            //        ("C", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllAdultsInTheFamily, true, new List<Guid>() { }),
            //        ("D", RequirementStage.Approval, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { }),
            //        ("E", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.OncePerFamily, true, new List<Guid>() { }),
            //        ("F", RequirementStage.Onboarding, VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily, true, new List<Guid>() { })));

            //AssertEx.SequenceIs(result);
        }
    }
}
