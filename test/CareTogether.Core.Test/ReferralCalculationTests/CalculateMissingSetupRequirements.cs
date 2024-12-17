using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingSetupRequirements
    {
        public static ArrangementPolicy SetupRequirements(params string[] values)
        {
            return new ArrangementPolicy(
                string.Empty,
                ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                values.ToImmutableList(),
                ImmutableList<MonitoringRequirement>.Empty,
                ImmutableList<string>.Empty
            );
        }

        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingSetupRequirements(
                    SetupRequirements("A", "B", "C"),
                    new ArrangementEntry(
                        "",
                        null,
                        null,
                        null,
                        Guid.Empty,
                        Helpers.Completed(),
                        Helpers.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        Helpers.ChildLocationHistory()
                    ),
                    new DateOnly(2022, 2, 1)
                );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, "A", null, null),
                new MissingArrangementRequirement(null, null, null, null, "B", null, null),
                new MissingArrangementRequirement(null, null, null, null, "C", null, null)
            );
        }

        [TestMethod]
        public void TestPartialRequirementsCompleted()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingSetupRequirements(
                    SetupRequirements("A", "B", "C"),
                    new ArrangementEntry(
                        "",
                        null,
                        null,
                        null,
                        Guid.Empty,
                        Helpers.Completed(("A", 1), ("A", 2), ("B", 3)),
                        Helpers.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        Helpers.ChildLocationHistory()
                    ),
                    new DateOnly(2022, 2, 1)
                );

            AssertEx.SequenceIs(result, new MissingArrangementRequirement(null, null, null, null, "C", null, null));
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingSetupRequirements(
                    SetupRequirements("A", "B", "C"),
                    new ArrangementEntry(
                        "",
                        null,
                        null,
                        null,
                        Guid.Empty,
                        Helpers.Completed(("A", 1), ("A", 2), ("B", 3), ("C", 12)),
                        Helpers.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        Helpers.ChildLocationHistory()
                    ),
                    new DateOnly(2022, 2, 1)
                );

            AssertEx.SequenceIs(result);
        }
    }
}
