using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingCloseoutRequirements
    {
        public static ArrangementPolicy CloseoutRequirements(params string[] values) =>
            new ArrangementPolicy(string.Empty, ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                ImmutableList<string>.Empty,
                ImmutableList<MonitoringRequirement>.Empty,
                values.ToImmutableList());

        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new ArrangementEntry(Guid.Empty, "", true, DateTime.MinValue,
                    StartedAtUtc: null, EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null, Reason: null),
                utcNow: new DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement(null, null, null, null, "A", null, null),
                new MissingArrangementRequirement(null, null, null, null, "B", null, null),
                new MissingArrangementRequirement(null, null, null, null, "C", null, null));
        }

        [TestMethod]
        public void TestPartialRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new ArrangementEntry(Guid.Empty, "", true, DateTime.MinValue,
                    StartedAtUtc: null, EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null, Reason: null),
                utcNow: new DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement(null, null, null, null, "C", null, null));
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements("A", "B", "C"),
                new ArrangementEntry(Guid.Empty, "", true, DateTime.MinValue,
                    StartedAtUtc: null, EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3), ("C", 12)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null, Reason: null),
                utcNow: new DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result);
        }
    }
}
