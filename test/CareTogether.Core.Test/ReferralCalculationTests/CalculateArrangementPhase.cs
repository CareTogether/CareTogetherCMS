using CareTogether.Engines;
using CareTogether.Resources;
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
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty);
            
            Assert.AreEqual(ArrangementPhase.ReadyToStart, result);
        }

        [TestMethod]
        public void TestNothingMissingStarted()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.Started, result);
        }

        [TestMethod]
        public void TestNothingMissingStartedAndEnded()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: DateTime.UtcNow,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.Ended, result);
        }

        [TestMethod]
        public void TestRequirementMissingNoDates()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("A", null, null)),
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty);

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }


        [TestMethod]
        public void TestFunctionMissingNoDates()
        {
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: null,
                endedAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty,
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStarted()
        {
            // Not a valid state, but included for completeness.
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: null,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("A", null, null)),
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }

        [TestMethod]
        public void TestRequirementsAndFunctionsMissingStartedAndEnded()
        {
            // Not a valid state, but included for completeness.
            var result = ReferralCalculations.CalculateArrangementPhase(
                startedAtUtc: DateTime.UtcNow,
                endedAtUtc: DateTime.UtcNow,
                missingSetupRequirements: ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("A", null, null)),
                missingFunctionAssignments: ImmutableList<VolunteerFunction>.Empty
                .Add(Helpers.FunctionWithoutEligibility("X", FunctionRequirement.OneOrMore)));

            Assert.AreEqual(ArrangementPhase.SettingUp, result);
        }
    }
}
