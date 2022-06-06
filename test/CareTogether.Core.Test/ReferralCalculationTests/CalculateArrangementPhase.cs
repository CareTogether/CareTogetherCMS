using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateArrangementPhase
    {
        [TestMethod]
        public void TestNothingMissingNoDates()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty);
            
            Assert.AreEqual(ArrangementPhase.ReadyToStart, result);
        }

        [TestMethod]
        public void TestNothingMissingStarted()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: null,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.Started, result);
        }

        [TestMethod]
        public void TestNothingMissingStartedAndEnded()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: DateTime.UtcNow,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.Ended, result);
        }

        [TestMethod]
        public void TestRequirementMissingNoDates()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement(null, null, null, null, "A", null, null)),
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementMissingCancelled()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                cancelledAtUtc: DateTime.UtcNow,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement(null, null, null, null, "A", null, null)),
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.Cancelled, result);
        }


        [TestMethod]
        public void TestFunctionMissingNoDates()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStarted()
        {
            // This could be a valid state if the policy has changed since the arrangement started.
            // Referral policy versioning is a solution to mitigate this scenario but it cannot
            // guarantee that this scenario will never happen as long as a policy can change.
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: null,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement(null, null, null, null, "A", null, null)),
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.Started, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStartedAndEnded()
        {
            // This could be a valid state if the policy has changed since the arrangement ended.
            // Referral policy versioning is a solution to mitigate this scenario but it cannot
            // guarantee that this scenario will never happen as long as a policy can change.
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: DateTime.UtcNow,
                cancelledAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement(null, null, null, null, "A", null, null)),
                missingFunctionAssignments: ImmutableList<ArrangementFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.Ended, result);
        }
    }
}
