using CareTogether.Engines;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class RequirementMetOrExemptedTests
    {
        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMet()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("A",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 2),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetMultipleTimes()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("A",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWillBeMetInTheFuture()
        {
            // Granted, this is an unusual situation. The behavior is
            // documented by this test for the sake of completeness.
            var result = ApprovalCalculations.RequirementMetOrExempted("B",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 1),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasNotMet()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("D",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatIsCurrentlyExempted()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("C",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 5),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatIsNoLongerExempted()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("C",
                policySupersededAtUtc: null, utcNow: new DateTime(2022, 1, 12),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetBeforeThePolicyWasSuperseded()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("A",
                policySupersededAtUtc: new DateTime(2022, 1, 20), utcNow: new DateTime(2022, 1, 22),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 2), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetAfterThePolicyWasSuperseded()
        {
            var result = ApprovalCalculations.RequirementMetOrExempted("B",
                policySupersededAtUtc: new DateTime(2022, 1, 20), utcNow: new DateTime(2022, 1, 22),
                completedRequirements: Helpers.Completed(("A", 1), ("B", 22), ("A", 3)),
                exemptedRequirements: Helpers.Exempted(("C", 10)));

            Assert.IsFalse(result);
        }
    }
}
