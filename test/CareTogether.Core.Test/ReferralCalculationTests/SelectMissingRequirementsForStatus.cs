using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class SelectMissingRequirementsForStatus
    {
        [TestMethod]
        public void TestSettingUp()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S2", true), null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M2", true), null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C2", true), null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.SettingUp,
                missingSetupRequirements,
                missingMonitoringRequirements,
                missingCloseoutRequirements
            );

            Assert.AreSame(result, missingSetupRequirements);
        }

        [TestMethod]
        public void TestReadyToStart()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S2", true), null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M2", true), null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C2", true), null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.ReadyToStart,
                missingSetupRequirements,
                missingMonitoringRequirements,
                missingCloseoutRequirements
            );

            Assert.AreEqual(0, result.Count);
        }

        [TestMethod]
        public void TestStarted()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S2", true), null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M2", true), null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C2", true), null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.Started,
                missingSetupRequirements,
                missingMonitoringRequirements,
                missingCloseoutRequirements
            );

            Assert.AreSame(result, missingMonitoringRequirements);
        }

        [TestMethod]
        public void TestEnded()
        {
            var missingSetupRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("S2", true), null, null));
            var missingMonitoringRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("M2", true), null, null));
            var missingCloseoutRequirements = ImmutableList<MissingArrangementRequirement>
                .Empty.Add(
                    new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C1", true), null, null)
                )
                .Add(new MissingArrangementRequirement(null, null, null, null, new RequirementDefinition("C2", true), null, null));

            var result = ReferralCalculations.SelectMissingRequirementsForStatus(
                ArrangementPhase.Ended,
                missingSetupRequirements,
                missingMonitoringRequirements,
                missingCloseoutRequirements
            );

            AssertEx.SequenceIs(
                result,
                missingCloseoutRequirements.Concat(missingMonitoringRequirements).ToArray()
            );
        }
    }
}
