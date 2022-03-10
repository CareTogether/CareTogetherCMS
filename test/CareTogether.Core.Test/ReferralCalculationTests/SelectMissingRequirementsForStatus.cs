using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class SelectMissingRequirementsForStatus
    {
        [TestMethod]
        public void TestSettingUp()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("S1", null, null))
                .Add(new MissingArrangementRequirement("S2", null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("M1", null, null))
                .Add(new MissingArrangementRequirement("M2", null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("C1", null, null))
                .Add(new MissingArrangementRequirement("C2", null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.SettingUp,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            Assert.AreSame(result, missingSetupRequirements);
        }

        [TestMethod]
        public void TestReadyToStart()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("S1", null, null))
                .Add(new MissingArrangementRequirement("S2", null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("M1", null, null))
                .Add(new MissingArrangementRequirement("M2", null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("C1", null, null))
                .Add(new MissingArrangementRequirement("C2", null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.ReadyToStart,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            Assert.AreEqual(0, result.Count);
        }

        [TestMethod]
        public void TestStarted()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("S1", null, null))
                .Add(new MissingArrangementRequirement("S2", null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("M1", null, null))
                .Add(new MissingArrangementRequirement("M2", null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("C1", null, null))
                .Add(new MissingArrangementRequirement("C2", null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.Started,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            Assert.AreSame(result, missingMonitoringRequirements);
        }

        [TestMethod]
        public void TestEnded()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("S1", null, null))
                .Add(new MissingArrangementRequirement("S2", null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("M1", null, null))
                .Add(new MissingArrangementRequirement("M2", null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>.Empty
                .Add(new MissingArrangementRequirement("C1", null, null))
                .Add(new MissingArrangementRequirement("C2", null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.Ended,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            AssertEx.SequenceIs(result, missingCloseoutRequirements.Concat(missingMonitoringRequirements).ToArray());
        }
    }
}
