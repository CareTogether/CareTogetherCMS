using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using H = CareTogether.Core.Test.V1CaseCalculationTests.Helpers;

namespace CareTogether.Core.Test.V1CaseCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirements
    {
        private static readonly RequirementDefinition RequirementA = new RequirementDefinition(
            "A",
            true
        );
        private static readonly RequirementDefinition RequirementB = new RequirementDefinition(
            "B",
            true
        );
        private static readonly RequirementDefinition RequirementOptional =
            new RequirementDefinition("Optional", false);

        public static ArrangementPolicy MonitoringRequirements(
            ImmutableList<MonitoringRequirement> values
        ) =>
            new ArrangementPolicy(
                string.Empty,
                ChildInvolvement.ChildHousing,
                [],
                [],
                [],
                [],
                [],
                values,
                []
            );

        [TestMethod]
        public void MonitoringRowsLoseRuleAndReactivationProvenance()
        {
            var firstRule = new MonitoringRequirement(
                RequirementA,
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2))
            );
            var secondRule = new MonitoringRequirement(
                RequirementA,
                new DurationStagesRecurrencePolicy([new(TimeSpan.FromDays(2), 1)])
            );
            var policy = MonitoringRequirements([firstRule, secondRule]);
            var arrangement = new ArrangementEntry(
                "",
                StartedAt: H.Date(1, 1),
                EndedAt: null,
                CancelledAt: null,
                Guid.Empty,
                [],
                [],
                [],
                [],
                []
            );

            var upcoming = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                policy,
                arrangement,
                H.Date(1, 2)
            );
            var overdue = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                policy,
                arrangement,
                H.Date(1, 3)
            );
            var completed = arrangement with { CompletedRequirements = H.Completed(("A", 2)) };
            var reopened = completed with { CompletedRequirements = [] };

            Assert.HasCount(2, upcoming);
            Assert.AreEqual(upcoming[0], upcoming[1]);
            Assert.AreEqual(H.Date(1, 3), upcoming[0].DueBy);
            Assert.HasCount(2, overdue);
            Assert.AreEqual(overdue[0], overdue[1]);
            Assert.AreEqual(
                upcoming[0] with { DueBy = null, PastDueSince = upcoming[0].DueBy },
                overdue[0]
            );
            Assert.IsEmpty(
                V1CaseCalculations.CalculateMissingMonitoringRequirements(policy, completed, H.Date(1, 3))
            );
            CollectionAssert.AreEqual(
                overdue,
                V1CaseCalculations.CalculateMissingMonitoringRequirements(policy, reopened, H.Date(1, 3))
            );

            var firstId = Guid.NewGuid();
            var secondId = Guid.NewGuid();
            var identifiedPolicy = MonitoringRequirements(
                [firstRule with { Id = firstId }, secondRule with { Id = secondId }]
            );
            var identified = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                identifiedPolicy,
                arrangement,
                H.Date(1, 2)
            );
            CollectionAssert.AreEqual(upcoming, identified);
            Assert.AreEqual(
                Newtonsoft.Json.JsonConvert.SerializeObject(upcoming),
                Newtonsoft.Json.JsonConvert.SerializeObject(identified)
            );
        }

        [TestMethod]
        public void TestNotStarted()
        {
            var result = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("A", true),
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
                                new RequirementDefinition("B", true),
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
            var result = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("A", true),
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
                                new RequirementDefinition("B", true),
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
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 3)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 10)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 17)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 24)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 31)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: H.Date(2, 14),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 8)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 15)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 22)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 29)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: H.Date(2, 5),
                    PastDueSince: null
                )
            );
        }

        [TestMethod]
        public void TestStartedSomeCompletions()
        {
            var result = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("A", true),
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
                                new RequirementDefinition("B", true),
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
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 10)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 17)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 24)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: null,
                    PastDueSince: H.Date(1, 31)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: H.Date(2, 14),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 14)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 21)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: null,
                    PastDueSince: H.Date(1, 28)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: H.Date(2, 4),
                    PastDueSince: null
                )
            );
        }

        [TestMethod]
        public void TestStartedUpToDate()
        {
            var result = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("A", true),
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
                                new RequirementDefinition("B", true),
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
                    RequirementA,
                    DueBy: H.Date(1, 10),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: H.Date(1, 14),
                    PastDueSince: null
                )
            );
        }

        [TestMethod]
        public void TestStartedUpToDateWithOptionalRequirement()
        {
            var result = V1CaseCalculations.CalculateMissingMonitoringRequirements(
                MonitoringRequirements(
                    ImmutableList<MonitoringRequirement>
                        .Empty.Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("Optional", false),
                                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2))
                            )
                        )
                        .Add(
                            new MonitoringRequirement(
                                new RequirementDefinition("A", true),
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
                                new RequirementDefinition("B", true),
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
                    RequirementOptional,
                    DueBy: null,
                    PastDueSince: H.Date(1, 3)
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementA,
                    DueBy: H.Date(1, 10),
                    PastDueSince: null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    RequirementB,
                    DueBy: H.Date(1, 14),
                    PastDueSince: null
                )
            );
        }
    }
}
