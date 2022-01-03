using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateFamilyVolunteerRoleApprovalStatus
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
        public void Test___()
        {
            //var result = ApprovalCalculations.FamilyRequirementMetOrExempted("Role", "C",
            //    VolunteerFamilyRequirementScope.OncePerFamily,
            //    supersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
            //    Helpers.Completed(("D", 1)),
            //    Helpers.Exempted(("C", 10)),
            //    Helpers.RemovedIndividualRoles(),
            //    Helpers.ActiveAdults(
            //        (guid1, Helpers.Completed(("A", 1), ("B", 1)), Helpers.Exempted()),
            //        (guid2, Helpers.Completed(("A", 1)), Helpers.Exempted())));

            //Assert.IsTrue(result);

            Assert.Inconclusive("Not implemented");
        }
    }
}
