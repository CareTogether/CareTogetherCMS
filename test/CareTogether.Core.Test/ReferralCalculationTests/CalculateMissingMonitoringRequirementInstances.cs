using CareTogether.Engines;
using CareTogether.Resources;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirementInstances
    {
        [TestMethod]
        public void TestNoCompletions()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        }

        [TestMethod]
        public void TestNoCompletionsEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: new DateTime(2022, 2, 1),
                completions: Helpers.Dates(),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        [TestMethod]
        public void TestOneCompletion()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestOneCompletionEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: new DateTime(2022, 2, 1),
                completions: Helpers.Dates((1, 2)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStage()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 2)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStageOnStageEndDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 1), (1, 2)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 9)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesOneMissedDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 10)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 20)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 10), (2, 24)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoGapsOfMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new RecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                arrangementStartedAtUtc: new DateTime(2022, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 20), (2, 9)),
                utcNow: new DateTime(2022, 2, 14));

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 23)));
        }
    }
}
