using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ReferralCalculationTests.Helpers;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirementInstances
    {
        [TestMethod]
        public void TestNoCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28))
            );
        }

        [TestMethod]
        public void TestNoCompletionsOnePolicyStage()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 8), (1, 15), (1, 22), (1, 29), (2, 5), (2, 12), (2, 19))
            );
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayedDurationBased()
        {
            //NOTE: This is NOT recommended. Use the OneTimeRecurrencePolicy instead!
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(2), 1)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayed()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(1, 2)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3)));
        }

        [TestMethod]
        public void TestOneOnTimeCompletionOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(1, 2)
            );

            AssertEx.SequenceIs(result, []);
        }

        [TestMethod]
        public void TestOnePastDueCompletionOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 4)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(1, 2)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementImmediate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(null),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            //TODO: This could instead be "max date" -- need to decide what's more intuitive for users.
            AssertEx.SequenceIs(result, H.Dates((1, 1)));
        }

        [TestMethod]
        public void TestOneCompletionOneTimeRequirementImmediate()
        {
            // Setting a delay of zero should never happen, but this documents the edge case.
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.Zero),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 5)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 1)));
        }

        [TestMethod]
        public void TestNoCompletionsEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: H.Date(2, 1),
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNoSkip()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 29),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 1),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 22),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 25)
                ),
                today: H.Date(2, 28)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24), (2, 17)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedWithSkip()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 2, true),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 29),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 1),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 22),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 25)
                ),
                today: H.Date(2, 28)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 17), (2, 10)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNotYetReturnedPastDue()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22)
                ),
                today: H.Date(2, 28)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNotYetReturnedDueInFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22)
                ),
                today: H.Date(2, 23)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24)));
        }

        [TestMethod]
        public void TestOneCompletion()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27))
            );
        }

        [TestMethod]
        public void TestOneCompletionEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: H.Date(2, 1),
                completions: H.Dates((1, 2)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 23), (1, 30)));
        }

        [TestMethod]
        public void TestCompletionsOnConsecutiveDays()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 3), (1, 4), (1, 5), (1, 10)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 24), (2, 7), (2, 21)));
        }

        [TestMethod]
        public void TestMultipleCompletionsOnRandomDays()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 4), (1, 6), (1, 17), (2, 3)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 13), (1, 31), (2, 17)));
        }

        [TestMethod]
        public void TestEdgeCaseOneCompletionBeforeStarted()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 7),
                arrangementEndedAtDate: H.Date(1, 10),
                completions: H.Dates((1, 5)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 1)
            );

            AssertEx.SequenceIs(result, H.Dates());
        }

        [TestMethod]
        public void TestEdgeCaseOneCompletionAfterEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 3),
                arrangementEndedAtDate: H.Date(1, 8),
                completions: H.Dates((1, 9)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 1)
            );

            AssertEx.SequenceIs(result, H.Dates());
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStage()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 2)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27))
            );
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStageOnStageEndDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 1), (1, 2)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 23), (2, 6), (2, 20)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 9)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesOneMissedDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 10)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 17), (1, 24), (2, 7), (2, 21)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 20)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 27), (2, 10), (2, 24)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoGapsOfMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 20), (2, 9)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 27), (2, 23)));
        }

        [TestMethod]
        public void TestCompletionInTheStartDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(8, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((8, 1)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(8, 10)
            );

            AssertEx.SequenceIs(result, H.Dates((8, 8), (8, 15)));
        }

        [TestMethod]
        public void TestCompletionInTheStartDateWithMultipleStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(8, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((8, 1)),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(8, 10)
            );

            AssertEx.SequenceIs(result, H.Dates((8, 8), (8, 15)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesNoLocations()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates());
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocation()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28))
            );
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationSimplePolicy()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>.Empty.Add(
                        new RecurrencePolicyStage(TimeSpan.FromDays(7), null)
                    )
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 8), (1, 15), (1, 22), (1, 29), (2, 5), (2, 12), (2, 19))
            );
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationWithReturnToParentInMiddle()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 3), (1, 10), (1, 20), (1, 27), (2, 3), (2, 17))
            );
        }

        [TestMethod]
        public void TestFilterToFirstFamilyWithPerChildLocationDurationStagesBeforeTransferToSecondFamily()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: H.Id('0'),
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('1'), ChildLocationPlan.DaytimeChildCare, 1, 15)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 10)));
        }

        [TestMethod]
        public void TestFilterToSecondFamilyWithPerChildLocationDurationStagesAfterTransferFromFirstFamily()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: H.Id('1'),
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('1'), ChildLocationPlan.DaytimeChildCare, 1, 15)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 17), (1, 24), (1, 31), (2, 7), (2, 14), (2, 28))
            );
        }

        [TestMethod]
        public void TestOneCompletionsAtResumeDateWithPerChildLocationDurationStagesOneLocationWithReturnToParentInMiddle()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 15)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 3), (1, 10), (1, 22), (1, 29), (2, 12), (2, 26))
            );
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationWithReturnToParentInMiddle2()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 20)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 10), (1, 25), (2, 1), (2, 8), (2, 22)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationWithReturnToParentAtEnd()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 7)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesTwoLocations()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(),
                today: H.Date(2, 14)
            );

            Assert.Inconclusive("Test not updated for multiple locations");
            AssertEx.SequenceIs(
                result,
                H.Dates( /*(1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)*/
                )
            );
        }

        [TestMethod]
        public void TestNoCompletionsEndedWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: H.Date(2, 1),
                completions: H.Dates(),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        // [TestMethod]
        // public void TestNoCompletionsOccurrenceBasedNoSkip()
        // {
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtDate: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtDate: null,
        //        completions: H.Dates(),
        //        childLocationHistory: H.ChildLocationHistory(
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 29),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 1),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 22),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 25)),
        //        today: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24), (2, 17)));
        // }

        // [TestMethod]
        // public void TestNoCompletionsOccurrenceBasedWithSkip()
        // {
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 2, true),
        //        arrangementStartedAtDate: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtDate: null,
        //        completions: H.Dates(),
        //        childLocationHistory: H.ChildLocationHistory(
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 29),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 1),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 2, 22),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 2, 25)),
        //        today: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, H.Dates((1, 17), (2, 10)));
        // }

        // [TestMethod]
        // public void TestNoCompletionsOccurrenceBasedNotYetReturnedPastDue()
        // {
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtDate: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtDate: null,
        //        completions: H.Dates(),
        //        childLocationHistory: H.ChildLocationHistory(
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22)),
        //        today: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24)));
        // }

        // [TestMethod]
        // public void TestNoCompletionsOccurrenceBasedNotYetReturnedDueInFuture()
        // {
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtDate: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtDate: null,
        //        completions: H.Dates(),
        //        childLocationHistory: H.ChildLocationHistory(
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 4),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 11),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (Guid.Empty, ChildLocationPlan.WithParent, 1, 18),
        //            (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 22)),
        //        today: new DateTime(H.YEAR, 2, 23));

        //    AssertEx.SequenceIs(result, H.Dates((1, 3), (1, 24)));
        // }

        [TestMethod]
        public void TestOneCompletionWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27))
            );
        }

        [TestMethod]
        public void TestOneCompletionEndedWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: H.Date(2, 1),
                completions: H.Dates((1, 2)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 23), (1, 30)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStageWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 2)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(
                result,
                H.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27))
            );
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStageOnStageEndDateWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 1), (1, 2)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 23), (2, 6), (2, 20)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 9)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesOneMissedDateWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 10)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 17), (1, 24), (2, 7), (2, 21)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoMissedDatesWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 20)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 27), (2, 10), (2, 24)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoGapsOfMissedDatesWithPerChildLocationDurationStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(
                    ImmutableList<RecurrencePolicyStage>
                        .Empty.Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))
                ),
                filterToFamilyId: null,
                arrangementStartedAtDate: H.Date(1, 1),
                arrangementEndedAtDate: null,
                completions: H.Dates((1, 2), (1, 20), (2, 9)),
                childLocationHistory: H.ChildLocationHistory(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1)
                ),
                today: H.Date(2, 14)
            );

            AssertEx.SequenceIs(result, H.Dates((1, 9), (1, 16), (1, 27), (2, 23)));
        }
    }
}
