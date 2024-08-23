using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;
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
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayedDurationBased()
        {
            //NOTE: This is NOT recommended. Use the OneTimeRecurrencePolicy instead!
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayed()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtUtc: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.DatesAtLastSecond(H.US_EASTERN_TIME_ZONE, (1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtUtc: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 2),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.DatesAtLastSecond(H.US_EASTERN_TIME_ZONE, (1, 3)));
        }

        [TestMethod]
        public void TestOneOnTimeCompletionOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 1, 2),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, []);
        }

        [TestMethod]
        public void TestOnePastDueCompletionOneTimeRequirementDelayedFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.FromDays(2)),
                filterToFamilyId: null,
                arrangementStartedAtUtc: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.DatesFromTimeZone(H.US_EASTERN_TIME_ZONE, (1, 4)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 2),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.DatesAtLastSecond(H.US_EASTERN_TIME_ZONE, (1, 3)));
        }

        [TestMethod]
        public void TestNoCompletionsOneTimeRequirementImmediate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(null),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            //TODO: This could instead be "max date" -- need to decide what's more intuitive for users.
            AssertEx.SequenceIs(result, Helpers.Dates((1, 1)));
        }

        [TestMethod]
        public void TestOneCompletionOneTimeRequirementImmediate()
        {
            // Setting a delay of zero should never happen, but this documents the edge case.
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new OneTimeRecurrencePolicy(TimeSpan.Zero),
                filterToFamilyId: null,
                arrangementStartedAtUtc: H.DateFromTimeZone(H.US_EASTERN_TIME_ZONE, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.DatesFromTimeZone(H.US_EASTERN_TIME_ZONE, (1, 5)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.DatesAtLastSecond(H.US_EASTERN_TIME_ZONE, (1, 1)));
        }

        [TestMethod]
        public void TestNoCompletionsEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: new DateTime(H.YEAR, 2, 1),
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNoSkip()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 4),
                    (ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (ChildLocationPlan.WithParent, 1, 11),
                    (ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (ChildLocationPlan.WithParent, 1, 18),
                    (ChildLocationPlan.DaytimeChildCare, 1, 22),
                    (ChildLocationPlan.WithParent, 1, 25),
                    (ChildLocationPlan.DaytimeChildCare, 1, 29),
                    (ChildLocationPlan.WithParent, 2, 1),
                    (ChildLocationPlan.DaytimeChildCare, 2, 8),
                    (ChildLocationPlan.WithParent, 2, 11),
                    (ChildLocationPlan.DaytimeChildCare, 2, 15),
                    (ChildLocationPlan.WithParent, 2, 18),
                    (ChildLocationPlan.DaytimeChildCare, 2, 22),
                    (ChildLocationPlan.WithParent, 2, 25)),
                utcNow: new DateTime(H.YEAR, 2, 28),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24), (2, 17)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedWithSkip()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 2, true),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 4),
                    (ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (ChildLocationPlan.WithParent, 1, 11),
                    (ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (ChildLocationPlan.WithParent, 1, 18),
                    (ChildLocationPlan.DaytimeChildCare, 1, 22),
                    (ChildLocationPlan.WithParent, 1, 25),
                    (ChildLocationPlan.DaytimeChildCare, 1, 29),
                    (ChildLocationPlan.WithParent, 2, 1),
                    (ChildLocationPlan.DaytimeChildCare, 2, 8),
                    (ChildLocationPlan.WithParent, 2, 11),
                    (ChildLocationPlan.DaytimeChildCare, 2, 15),
                    (ChildLocationPlan.WithParent, 2, 18),
                    (ChildLocationPlan.DaytimeChildCare, 2, 22),
                    (ChildLocationPlan.WithParent, 2, 25)),
                utcNow: new DateTime(H.YEAR, 2, 28),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 17), (2, 10)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNotYetReturnedPastDue()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 4),
                    (ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (ChildLocationPlan.WithParent, 1, 11),
                    (ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (ChildLocationPlan.WithParent, 1, 18),
                    (ChildLocationPlan.DaytimeChildCare, 1, 22)),
                utcNow: new DateTime(H.YEAR, 2, 28),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24)));
        }

        [TestMethod]
        public void TestNoCompletionsOccurrenceBasedNotYetReturnedDueInFuture()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 4),
                    (ChildLocationPlan.DaytimeChildCare, 1, 8),
                    (ChildLocationPlan.WithParent, 1, 11),
                    (ChildLocationPlan.DaytimeChildCare, 1, 15),
                    (ChildLocationPlan.WithParent, 1, 18),
                    (ChildLocationPlan.DaytimeChildCare, 1, 22)),
                utcNow: new DateTime(H.YEAR, 2, 23),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24)));
        }

        [TestMethod]
        public void TestOneCompletion()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestOneCompletionEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: new DateTime(H.YEAR, 2, 1),
                completions: Helpers.Dates((1, 2)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30)));
        }

        [TestMethod]
        public void TestEdgeCaseOneCompletionBeforeStarted()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 7),
                arrangementEndedAtUtc: new DateTime(H.YEAR, 1, 10),
                completions: Helpers.Dates((1, 5)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 1),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates());
        }

        [TestMethod]
        public void TestEdgeCaseOneCompletionAfterEnded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 3),
                arrangementEndedAtUtc: new DateTime(H.YEAR, 1, 8),
                completions: Helpers.Dates((1, 9)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 1),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates());
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStage()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 2)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstStageOnStageEndDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 1), (1, 2)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStages()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 9)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesOneMissedDate()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 10)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 20)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 10), (2, 24)));
        }

        [TestMethod]
        public void TestTwoCompletionsInFirstAndSecondStagesTwoGapsOfMissedDates()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates((1, 2), (1, 20), (2, 9)),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 23)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesNoLocations()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates());
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocation()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1)),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationWithReturnToParentInMiddle()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 15)),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 20), (1, 27), (2, 3), (2, 17)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesOneLocationWithReturnToParentAtEnd()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 2, 7)),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        }

        [TestMethod]
        public void TestNoCompletionsWithPerChildLocationDurationStagesTwoLocations()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
                new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
                .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
                filterToFamilyId: null,
                arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
                arrangementEndedAtUtc: null,
                completions: Helpers.Dates(),
                childLocationHistory: Helpers.LocationHistoryEntries(),
                utcNow: new DateTime(H.YEAR, 2, 14),
                H.US_EASTERN_TIME_ZONE);

            Assert.Inconclusive("Test not updated for multiple locations");
            AssertEx.SequenceIs(result, Helpers.Dates(/*(1, 3), (1, 10), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)*/));
        }

        //[TestMethod]
        //public void TestNoCompletionsEndedWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: new DateTime(H.YEAR, 2, 1),
        //        completions: Helpers.Dates(),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 10), (1, 17), (1, 24), (1, 31)));
        //}

        //[TestMethod]
        //public void TestNoCompletionsOccurrenceBasedNoSkip()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates(),
        //        childLocationHistory: Helpers.LocationHistoryEntries(
        //            (ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (ChildLocationPlan.WithParent, 1, 4),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (ChildLocationPlan.WithParent, 1, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (ChildLocationPlan.WithParent, 1, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 22),
        //            (ChildLocationPlan.WithParent, 1, 25),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 29),
        //            (ChildLocationPlan.WithParent, 2, 1),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 8),
        //            (ChildLocationPlan.WithParent, 2, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 15),
        //            (ChildLocationPlan.WithParent, 2, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 22),
        //            (ChildLocationPlan.WithParent, 2, 25)),
        //        utcNow: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24), (2, 17)));
        //}

        //[TestMethod]
        //public void TestNoCompletionsOccurrenceBasedWithSkip()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 2, true),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates(),
        //        childLocationHistory: Helpers.LocationHistoryEntries(
        //            (ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (ChildLocationPlan.WithParent, 1, 4),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (ChildLocationPlan.WithParent, 1, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (ChildLocationPlan.WithParent, 1, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 22),
        //            (ChildLocationPlan.WithParent, 1, 25),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 29),
        //            (ChildLocationPlan.WithParent, 2, 1),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 8),
        //            (ChildLocationPlan.WithParent, 2, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 15),
        //            (ChildLocationPlan.WithParent, 2, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 2, 22),
        //            (ChildLocationPlan.WithParent, 2, 25)),
        //        utcNow: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 17), (2, 10)));
        //}

        //[TestMethod]
        //public void TestNoCompletionsOccurrenceBasedNotYetReturnedPastDue()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates(),
        //        childLocationHistory: Helpers.LocationHistoryEntries(
        //            (ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (ChildLocationPlan.WithParent, 1, 4),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (ChildLocationPlan.WithParent, 1, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (ChildLocationPlan.WithParent, 1, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 22)),
        //        utcNow: new DateTime(H.YEAR, 2, 28));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24)));
        //}

        //[TestMethod]
        //public void TestNoCompletionsOccurrenceBasedNotYetReturnedDueInFuture()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromDays(2), 3, 0, true),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates(),
        //        childLocationHistory: Helpers.LocationHistoryEntries(
        //            (ChildLocationPlan.DaytimeChildCare, 1, 1),
        //            (ChildLocationPlan.WithParent, 1, 4),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 8),
        //            (ChildLocationPlan.WithParent, 1, 11),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 15),
        //            (ChildLocationPlan.WithParent, 1, 18),
        //            (ChildLocationPlan.DaytimeChildCare, 1, 22)),
        //        utcNow: new DateTime(H.YEAR, 2, 23));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 3), (1, 24)));
        //}

        //[TestMethod]
        //public void TestOneCompletionWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        //}

        //[TestMethod]
        //public void TestOneCompletionEndedWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: new DateTime(H.YEAR, 2, 1),
        //        completions: Helpers.Dates((1, 2)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstStageWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2), (1, 2)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstStageOnStageEndDateWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 1), (1, 2)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstAndSecondStagesWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2), (1, 9)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 16), (1, 23), (1, 30), (2, 13), (2, 27)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstAndSecondStagesOneMissedDateWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2), (1, 10)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 17), (1, 24), (1, 31), (2, 14), (2, 28)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstAndSecondStagesTwoMissedDatesWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2), (1, 20)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 10), (2, 24)));
        //}

        //[TestMethod]
        //public void TestTwoCompletionsInFirstAndSecondStagesTwoGapsOfMissedDatesWithPerChildLocationDurationStages()
        //{
        //    var result = ReferralCalculations.CalculateMissingMonitoringRequirementInstances(
        //        new DurationStagesPerChildLocationRecurrencePolicy(ImmutableList<RecurrencePolicyStage>.Empty
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(2), 1))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(7), 4))
        //        .Add(new RecurrencePolicyStage(TimeSpan.FromDays(14), null))),
        //        arrangementStartedAtUtc: new DateTime(H.YEAR, 1, 1),
        //        arrangementEndedAtUtc: null,
        //        completions: Helpers.Dates((1, 2), (1, 20), (2, 9)),
        //        childLocationHistory: Helpers.LocationHistoryEntries(),
        //        utcNow: new DateTime(H.YEAR, 2, 14));

        //    AssertEx.SequenceIs(result, Helpers.Dates((1, 9), (1, 16), (1, 27), (2, 23)));
        //}
    }
}
