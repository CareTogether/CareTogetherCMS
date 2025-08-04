using System;
using System.Collections.Immutable;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingCloseoutRequirements
    {
        public static ArrangementPolicy CloseoutRequirements(params string[] values) =>
            new ArrangementPolicy(
                string.Empty,
                ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                ImmutableList<string>.Empty,
                ImmutableList<MonitoringRequirement>.Empty,
                values.ToImmutableList()
            );

        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: DateOnly.MinValue,
                    EndedAt: null,
                    CancelledAt: null,
                    Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
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
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3)),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, "C", null, null)
            );
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3), ("C", 12)),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
            );

            AssertEx.SequenceIs(result);
        }
    }
}
