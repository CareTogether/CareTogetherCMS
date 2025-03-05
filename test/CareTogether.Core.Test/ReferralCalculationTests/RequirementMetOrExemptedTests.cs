using System;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using H = CareTogether.Core.Test.ReferralCalculationTests.Helpers;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class RequirementMetOrExemptedTests
    {
        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMet()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 2),
                H.Completed(("A", 1), ("B", 2)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetMultipleTimes()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 5),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWillBeMetInTheFuture()
        {
            // Granted, this is an unusual situation. The behavior is
            // documented by this test for the sake of completeness.
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "B",
                null,
                new DateOnly(H.YEAR, 1, 1),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasNotMet()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "D",
                null,
                new DateOnly(H.YEAR, 1, 5),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsFalse(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatIsCurrentlyExempted()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "C",
                null,
                new DateOnly(H.YEAR, 1, 5),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.AreEqual(new DateOnly(H.YEAR, 1, 10), result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatIsNoLongerExempted()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "C",
                null,
                new DateOnly(H.YEAR, 1, 12),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsFalse(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetBeforeThePolicyWasSuperseded()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                new DateOnly(H.YEAR, 1, 20),
                new DateOnly(H.YEAR, 1, 22),
                H.Completed(("A", 1), ("B", 2), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetAfterThePolicyWasSuperseded()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "B",
                new DateOnly(H.YEAR, 1, 20),
                new DateOnly(H.YEAR, 1, 22),
                H.Completed(("A", 1), ("B", 22), ("A", 3)),
                H.Exempted(("C", 10))
            );

            Assert.IsFalse(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetAndNotYetExpired()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 2),
                H.CompletedWithExpiry(("A", 1, 4), ("B", 2, null)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.AreEqual(new DateOnly(H.YEAR, 1, 4), result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetButExpired()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 5),
                H.CompletedWithExpiry(("A", 1, 4), ("B", 2, null)),
                H.Exempted(("C", 10))
            );

            Assert.IsFalse(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetButExpiredJustNow()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 4),
                H.CompletedWithExpiry(("A", 1, 4), ("B", 2, null)),
                H.Exempted(("C", 10))
            );

            Assert.IsFalse(result.IsMetOrExempted);
            Assert.IsNull(result.ExpiresAtUtc);
        }

        [TestMethod]
        public void TestRequirementMetOrExemptedThatWasMetMultipleTimesWithSomeExpired()
        {
            SharedCalculations.RequirementCheckResult result = SharedCalculations.RequirementMetOrExempted(
                "A",
                null,
                new DateOnly(H.YEAR, 1, 5),
                H.CompletedWithExpiry(("A", 1, 3), ("B", 2, 4), ("A", 3, 7)),
                H.Exempted(("C", 10))
            );

            Assert.IsTrue(result.IsMetOrExempted);
            Assert.AreEqual(new DateOnly(H.YEAR, 1, 7), result.ExpiresAtUtc);
        }
    }
}
