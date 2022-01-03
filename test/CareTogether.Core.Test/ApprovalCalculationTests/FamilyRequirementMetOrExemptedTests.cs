using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class FamilyRequirementMetOrExemptedTests
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
        public void TestAllAdultsWithNoActiveAdults()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults());

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestAllParticipatingAdultsWithNoActiveAdults()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults());

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestOncePerFamilyWithNoActiveAdults()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(("A", 1)),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults());

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestOncePerFamilyWithNoActiveAdultsExemptionVariant()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(("A", 1)),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults());

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestAllAdultsRequirementMet()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "A",
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestAllAdultsRequirementNotMet()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestAllAdultsRequirementNotMetByAnyAdults()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestAllParticipatingAdultsRequirementNotMet()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestAllParticipatingAdultsRequirementMetWithExemption()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10)))));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestAllParticipatingAdultsRequirementMetWithExpiredExemption()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "B",
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted(("B", 10)))));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestOncePerFamilyRequirementNotMet()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(("D", 1)),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestOncePerFamilyRequirementMet()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "D",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(("D", 1)),
                Helpers.Exempted(),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestOncePerFamilyRequirementMetExemptionVariant()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                Helpers.Completed(("D", 1)),
                Helpers.Exempted(("C", 10)),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsTrue(result);
        }


        [TestMethod]
        public void TestOncePerFamilyRequirementMetExpiredExemptionVariant()
        {
            var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
                VolunteerFamilyRequirementScope.OncePerFamily,
                supersededAtUtc: null, utcNow: new DateTime(2022, 1, 20),
                Helpers.Completed(("D", 1)),
                Helpers.Exempted(("C", 10)),
                Helpers.RemovedIndividualRoles(),
                Helpers.ActiveAdults(
                    (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
                    (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            Assert.IsFalse(result);
        }
    }
}
