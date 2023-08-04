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
    public class CalculateEffectiveRoleVersionApproval
    {
        [TestMethod]
        public void TestEmptyInputListReturnsNull()
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(
                ImmutableList<RoleVersionApproval>.Empty,
                utcNow: new DateTime(2023, 8, 4));

            Assert.IsNull(result);
        }
        
        [DataRow(RoleApprovalStatus.Prospective)]
        [DataRow(RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Onboarded)]
        [DataTestMethod]
        public void TestSingleNonexpiredValueIsReturnedUnmodified(RoleApprovalStatus status)
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval>.Empty
                .Add(new RoleVersionApproval("V1", status, new DateTime(2023, 8, 10))),
                utcNow: new DateTime(2023, 8, 4));

            Assert.AreEqual(new RoleVersionApproval("V1", status, new DateTime(2023, 8, 10)), result);
        }
        
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Expired)]
        [DataTestMethod]
        public void TestSingleExpiredValueIsReturnedAsExpiredUnlessProspective(
            RoleApprovalStatus status, RoleApprovalStatus expected)
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval>.Empty
                .Add(new RoleVersionApproval("V1", status, new DateTime(2023, 8, 1))),
                utcNow: new DateTime(2023, 8, 4));

            Assert.AreEqual(new RoleVersionApproval("V1", expected, new DateTime(2023, 8, 1)), result);
        }
        
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Expired, RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Prospective, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Expired, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded)]
        [DataTestMethod]
        public void TestTwoNonexpiredValuesWithSameExpirationDateFollowPrecedence(
            RoleApprovalStatus statusA, RoleApprovalStatus statusB, RoleApprovalStatus expected)
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval>.Empty
                .Add(new RoleVersionApproval("V1", statusA, new DateTime(2023, 8, 10)))
                .Add(new RoleVersionApproval("V1", statusB, new DateTime(2023, 8, 10))),
                utcNow: new DateTime(2023, 8, 4));

            Assert.AreEqual(new RoleVersionApproval("V1", expected, new DateTime(2023, 8, 10)), result);
        }
        
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, 10)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, 10)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Expired, RoleApprovalStatus.Approved, 10)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Prospective, RoleApprovalStatus.Onboarded, 10)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Expired, RoleApprovalStatus.Onboarded, 10)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, 10)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataTestMethod]
        public void TestTwoNonexpiredValuesWithStaggeredExpirationDatesFollowPrecedenceAndThenDate(
            RoleApprovalStatus statusA, RoleApprovalStatus statusB, RoleApprovalStatus expected, int date)
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval>.Empty
                .Add(new RoleVersionApproval("V1", statusA, new DateTime(2023, 8, 10)))
                .Add(new RoleVersionApproval("V1", statusB, new DateTime(2023, 8, 20))),
                utcNow: new DateTime(2023, 8, 4));

            Assert.AreEqual(new RoleVersionApproval("V1", expected, new DateTime(2023, 8, date)), result);
        }
        
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective, RoleApprovalStatus.Prospective, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Prospective, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, 10)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Expired, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, 10)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Prospective, RoleApprovalStatus.Expired, 10)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Expired, RoleApprovalStatus.Expired, 20)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Approved, RoleApprovalStatus.Approved, 20)]
        [DataRow(RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, RoleApprovalStatus.Onboarded, 20)]
        [DataTestMethod]
        public void TestTwoValuesWithFirstExpiredHonorExpirationThenFollowPrecedenceAndThenDate(
            RoleApprovalStatus statusA, RoleApprovalStatus statusB, RoleApprovalStatus expected, int date)
        {
            var result = ApprovalCalculations.CalculateEffectiveRoleVersionApproval(ImmutableList<RoleVersionApproval>.Empty
                .Add(new RoleVersionApproval("V1", statusA, new DateTime(2023, 8, 10)))
                .Add(new RoleVersionApproval("V1", statusB, new DateTime(2023, 8, 20))),
                utcNow: new DateTime(2023, 8, 15));

            Assert.AreEqual(new RoleVersionApproval("V1", expected, new DateTime(2023, 8, date)), result);
        }
    }
}
