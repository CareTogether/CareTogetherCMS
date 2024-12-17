using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using H = CareTogether.Core.Test.ReferralCalculationTests.Helpers;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirements
    {
        public static ArrangementPolicy MonitoringRequirements(ImmutableList<MonitoringRequirement> values)
        {
            return new ArrangementPolicy(
                string.Empty,
                ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                ImmutableList<string>.Empty,
                values,
                ImmutableList<string>.Empty
            );
        }

        [TestMethod]
        public void TestNotStarted()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingMonitoringRequirements(
                    MonitoringRequirements(
                        ImmutableList<MonitoringRequirement>
                            .Empty.Add(
                                new MonitoringRequirement(
                                    "A",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>
                                            .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                                    )
                                )
                            )
                            .Add(
                                new MonitoringRequirement(
                                    "B",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>.Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                        )
                                    )
                                )
                            )
                    ),
                    new ArrangementEntry(
                        "",
                        null,
                        null,
                        null,
                        Guid.Empty,
                        H.Completed(),
                        H.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        H.ChildLocationHistory()
                    ),
                    H.Date(1, 31)
                );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestStartedNoCompletions()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingMonitoringRequirements(
                    MonitoringRequirements(
                        ImmutableList<MonitoringRequirement>
                            .Empty.Add(
                                new MonitoringRequirement(
                                    "A",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>
                                            .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                                    )
                                )
                            )
                            .Add(
                                new MonitoringRequirement(
                                    "B",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>.Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                        )
                                    )
                                )
                            )
                    ),
                    new ArrangementEntry(
                        "",
                        H.Date(1, 1),
                        null,
                        null,
                        Guid.Empty,
                        H.Completed(),
                        H.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        H.ChildLocationHistory()
                    ),
                    H.Date(1, 31)
                );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 3)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 10)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 17)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 24)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 31)),
                new MissingArrangementRequirement(null, null, null, null, "A", H.Date(2, 14), null),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 8)),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 15)),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 22)),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 29)),
                new MissingArrangementRequirement(null, null, null, null, "B", H.Date(2, 5), null)
            );
        }

        [TestMethod]
        public void TestStartedSomeCompletions()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingMonitoringRequirements(
                    MonitoringRequirements(
                        ImmutableList<MonitoringRequirement>
                            .Empty.Add(
                                new MonitoringRequirement(
                                    "A",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>
                                            .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                                    )
                                )
                            )
                            .Add(
                                new MonitoringRequirement(
                                    "B",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>.Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                        )
                                    )
                                )
                            )
                    ),
                    new ArrangementEntry(
                        "",
                        H.Date(1, 1),
                        null,
                        null,
                        Guid.Empty,
                        H.Completed(("A", 3), ("B", 7)),
                        H.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        H.ChildLocationHistory()
                    ),
                    H.Date(1, 31)
                );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 10)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 17)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 24)),
                new MissingArrangementRequirement(null, null, null, null, "A", null, H.Date(1, 31)),
                new MissingArrangementRequirement(null, null, null, null, "A", H.Date(2, 14), null),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 14)),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 21)),
                new MissingArrangementRequirement(null, null, null, null, "B", null, H.Date(1, 28)),
                new MissingArrangementRequirement(null, null, null, null, "B", H.Date(2, 4), null)
            );
        }

        [TestMethod]
        public void TestStartedUpToDate()
        {
            ImmutableList<MissingArrangementRequirement> result =
                ReferralCalculations.CalculateMissingMonitoringRequirements(
                    MonitoringRequirements(
                        ImmutableList<MonitoringRequirement>
                            .Empty.Add(
                                new MonitoringRequirement(
                                    "A",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>
                                            .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                                            .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                                    )
                                )
                            )
                            .Add(
                                new MonitoringRequirement(
                                    "B",
                                    new DurationStagesRecurrencePolicy(
                                        ImmutableList<RecurrencePolicyStage>.Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                                        )
                                    )
                                )
                            )
                    ),
                    new ArrangementEntry(
                        "",
                        H.Date(1, 1),
                        null,
                        null,
                        Guid.Empty,
                        H.Completed(("A", 3), ("B", 7)),
                        H.Exempted(),
                        ImmutableList<IndividualVolunteerAssignment>.Empty,
                        ImmutableList<FamilyVolunteerAssignment>.Empty,
                        H.ChildLocationHistory()
                    ),
                    H.Date(1, 8)
                );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, "A", H.Date(1, 10), null),
                new MissingArrangementRequirement(null, null, null, null, "B", H.Date(1, 14), null)
            );
        }
    }
}
