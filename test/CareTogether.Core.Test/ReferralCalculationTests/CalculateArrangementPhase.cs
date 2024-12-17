using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateArrangementPhase
    {
        [TestMethod]
        public void TestNothingMissingNoDates()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                null,
                null,
                null,
                ImmutableList<MissingArrangementRequirement>.Empty,
                ImmutableList<ArrangementFunction>.Empty
            );

            Assert.AreEqual(ArrangementPhase.ReadyToStart, result);
        }

        [TestMethod]
        public void TestNothingMissingStarted()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                DateOnly.FromDateTime(DateTime.UtcNow),
                null,
                null,
                ImmutableList<MissingArrangementRequirement>.Empty,
                ImmutableList<ArrangementFunction>.Empty
            );

            Assert.AreEqual(ArrangementPhase.Started, result);
        }

        [TestMethod]
        public void TestNothingMissingStartedAndEnded()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                DateOnly.FromDateTime(DateTime.UtcNow),
                DateOnly.FromDateTime(DateTime.UtcNow),
                null,
                ImmutableList<MissingArrangementRequirement>.Empty,
                ImmutableList<ArrangementFunction>.Empty
            );

            Assert.AreEqual(ArrangementPhase.Ended, result);
        }

        [TestMethod]
        public void TestRequirementMissingNoDates()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                null,
                null,
                null,
                ImmutableList<MissingArrangementRequirement>.Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, "A", null, null)
                ),
                ImmutableList<ArrangementFunction>.Empty
            );

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementMissingCancelled()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                null,
                null,
                DateOnly.FromDateTime(DateTime.UtcNow),
                ImmutableList<MissingArrangementRequirement>.Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, "A", null, null)
                ),
                ImmutableList<ArrangementFunction>.Empty
            );

            Assert.AreEqual(ArrangementPhase.Cancelled, result);
        }

        [TestMethod]
        public void TestFunctionMissingNoDates()
        {
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                null,
                null,
                null,
                ImmutableList<MissingArrangementRequirement>.Empty,
                ImmutableList<ArrangementFunction>.Empty.Add(
                    Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)
                )
            );

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStarted()
        {
            // This could be a valid state if the policy has changed since the arrangement started.
            // Referral policy versioning is a solution to mitigate this scenario but it cannot
            // guarantee that this scenario will never happen as long as a policy can change.
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                DateOnly.FromDateTime(DateTime.UtcNow),
                null,
                null,
                ImmutableList<MissingArrangementRequirement>.Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, "A", null, null)
                ),
                ImmutableList<ArrangementFunction>.Empty.Add(
                    Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)
                )
            );

            Assert.AreEqual(ArrangementPhase.Started, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStartedAndEnded()
        {
            // This could be a valid state if the policy has changed since the arrangement ended.
            // Referral policy versioning is a solution to mitigate this scenario but it cannot
            // guarantee that this scenario will never happen as long as a policy can change.
            ArrangementPhase result = ReferralCalculations.CalculateArrangementPhase(
                DateOnly.FromDateTime(DateTime.UtcNow),
                DateOnly.FromDateTime(DateTime.UtcNow),
                null,
                ImmutableList<MissingArrangementRequirement>.Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, "A", null, null)
                ),
                ImmutableList<ArrangementFunction>.Empty.Add(
                    Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)
                )
            );

            Assert.AreEqual(ArrangementPhase.Ended, result);
        }
    }
}
