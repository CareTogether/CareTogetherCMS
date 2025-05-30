﻿using System;
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
        public static ArrangementPolicy MonitoringRequirements(
            ImmutableList<MonitoringRequirement> values
        ) =>
            new ArrangementPolicy(
                string.Empty,
                ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty,
                ImmutableList<string>.Empty,
                values,
                ImmutableList<string>.Empty
            );

        [TestMethod]
        public void TestNotStarted()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                "A",
                                new DurationStagesRecurrencePolicy(
                                    ImmutableList<RecurrencePolicyStage>
                                        .Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(2), 1)
                                        )
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
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: H.Date(1, 31)
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestStartedNoCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                "A",
                                new DurationStagesRecurrencePolicy(
                                    ImmutableList<RecurrencePolicyStage>
                                        .Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(2), 1)
                                        )
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
                    StartedAt: H.Date(1, 1),
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: H.Date(1, 31)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 3)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 10)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 17)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 24)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 31)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: H.Date(2, 14),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 8)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 15)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 22)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 29)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: H.Date(2, 5),
                    PastDueSince: null
                )
            );
        }

        [TestMethod]
        public void TestStartedSomeCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                "A",
                                new DurationStagesRecurrencePolicy(
                                    ImmutableList<RecurrencePolicyStage>
                                        .Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(2), 1)
                                        )
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
                    StartedAt: H.Date(1, 1),
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 3), ("B", 7)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: H.Date(1, 31)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 10)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 17)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 24)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: null,
                    PastDueSince: H.Date(1, 31)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: H.Date(2, 14),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 14)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 21)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: null,
                    PastDueSince: H.Date(1, 28)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: H.Date(2, 4),
                    PastDueSince: null
                )
            );
        }

        [TestMethod]
        public void TestStartedUpToDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                "A",
                                new DurationStagesRecurrencePolicy(
                                    ImmutableList<RecurrencePolicyStage>
                                        .Empty.Add(
                                            new RecurrencePolicyStage(TimeSpan.FromDays(2), 1)
                                        )
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
                    StartedAt: H.Date(1, 1),
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 3), ("B", 7)),
                    Helpers.Exempted(),
                    ImmutableList<IndividualVolunteerAssignment>.Empty,
                    ImmutableList<FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: H.Date(1, 8)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "A",
                    DueBy: H.Date(1, 10),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    "B",
                    DueBy: H.Date(1, 14),
                    PastDueSince: null
                )
            );
        }
    }
}
