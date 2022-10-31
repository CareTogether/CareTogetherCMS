using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirements
    {
        public static ArrangementPolicy MonitoringRequirements(ImmutableList<MonitoringRequirement> values) =>
            new ArrangementPolicy(string.Empty, ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                ImmutableList<string>.Empty,
                values,
                ImmutableList<string>.Empty);

        [TestMethod]
        public void TestNotStarted()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(ImmutableList<MonitoringRequirement>.Empty
                    .Add(new MonitoringRequirement("A", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null)))))
                    .Add(new MonitoringRequirement("B", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null)))))),
                new ArrangementEntry(Guid.Empty, "", DateTime.MinValue,
                    StartedAtUtc: null, EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null),
                utcNow: new DateTime(2022, 1, 31));

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestStartedNoCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(ImmutableList<MonitoringRequirement>.Empty
                    .Add(new MonitoringRequirement("A", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null)))))
                    .Add(new MonitoringRequirement("B", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null)))))),
                new ArrangementEntry(Guid.Empty, "", DateTime.MinValue,
                    StartedAtUtc: new DateTime(2022, 1, 1), EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null),
                utcNow: new DateTime(2022, 1, 31));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 3)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 10)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 17)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 24)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 31)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: new DateTime(2022, 2, 14), PastDueSince: null),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 8)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 15)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 22)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 29)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: new DateTime(2022, 2, 5), PastDueSince: null));
        }

        [TestMethod]
        public void TestStartedSomeCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(ImmutableList<MonitoringRequirement>.Empty
                    .Add(new MonitoringRequirement("A", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null)))))
                    .Add(new MonitoringRequirement("B", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null)))))),
                new ArrangementEntry(Guid.Empty, "", DateTime.MinValue,
                    StartedAtUtc: new DateTime(2022, 1, 1), EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(("A", 3), ("B", 7)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null),
                utcNow: new DateTime(2022, 1, 31));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 10)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 17)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 24)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: null, PastDueSince: new DateTime(2022, 1, 31)),
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: new DateTime(2022, 2, 14), PastDueSince: null),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 14)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 21)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: null, PastDueSince: new DateTime(2022, 1, 28)),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: new DateTime(2022, 2, 4), PastDueSince: null));
        }

        [TestMethod]
        public void TestStartedUpToDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(ImmutableList<MonitoringRequirement>.Empty
                    .Add(new MonitoringRequirement("A", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null)))))
                    .Add(new MonitoringRequirement("B", new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null)))))),
                new ArrangementEntry(Guid.Empty, "", DateTime.MinValue,
                    StartedAtUtc: new DateTime(2022, 1, 1), EndedAtUtc: null,
                    null, null, null, Guid.Empty,
                    Helpers.Completed(("A", 3), ("B", 7)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.LocationHistoryEntries(),
                    Helpers.LocationHistoryEntries(),
                    Comments: null),
                utcNow: new DateTime(2022, 1, 8));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement(null, null, null, null, "A", DueBy: new DateTime(2022, 1, 10), PastDueSince: null),
                new MissingArrangementRequirement(null, null, null, null, "B", DueBy: new DateTime(2022, 1, 14), PastDueSince: null));
        }
    }
}
