using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;
using Timelines;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingMonitoringRequirementsWithinCompletionGap
    {
        [TestMethod]
        public void TestOneStageAroundClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18));
        }

        [TestMethod]
        public void TestOneStageAroundClosedGapDateCurrentTimeIsWithin()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 15),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16));
        }

        [TestMethod]
        public void TestOneStageAroundClosedGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(7), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 17));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 20),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGapOneDayOffset()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 21),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(7), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 17),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 31));
        }

        [TestMethod]
        public void TestOneStageEndingBeforeCurrentTimeOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(7), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 17),
                new DateOnly(2022, 1, 24));
        }

        [TestMethod]
        public void TestOneStageWithClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 10), new DateTime(2022, 1, 31)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGapDateCurrentTimeIsWithin()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 15),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(7), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 17));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 20),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapOneDayOffset()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 21),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(7), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 17),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 31));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapSecondIncluded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 2, 14),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 1), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 26),
                new DateOnly(2022, 1, 28),
                new DateOnly(2022, 1, 30),
                new DateOnly(2022, 2, 3),
                new DateOnly(2022, 2, 7),
                new DateOnly(2022, 2, 11),
                new DateOnly(2022, 2, 15));
        }

        [TestMethod]
        public void TestMultipleStagesFirstWithClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 1, 20)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 10), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstWithOpenGapSecondIncluded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 2, 14),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 10), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28)))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 26),
                new DateOnly(2022, 1, 28),
                new DateOnly(2022, 1, 30),
                new DateOnly(2022, 2, 3),
                new DateOnly(2022, 2, 7),
                new DateOnly(2022, 2, 11),
                new DateOnly(2022, 2, 15));
        }

        [TestMethod]
        public void TestMultipleStagesBeforeInAndAfterClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 3, 15),
                gap: new Timeline(new DateTime(2022, 1, 10), new DateTime(2022, 3, 31)),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 10), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28))))
                .Add((TimeSpan.FromDays(8), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 2, 28), DateTime.MaxValue))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 26),
                new DateOnly(2022, 1, 28),
                new DateOnly(2022, 1, 30),
                new DateOnly(2022, 2, 3),
                new DateOnly(2022, 2, 7),
                new DateOnly(2022, 2, 11),
                new DateOnly(2022, 2, 15),
                new DateOnly(2022, 2, 19),
                new DateOnly(2022, 2, 23),
                new DateOnly(2022, 2, 27),
                new DateOnly(2022, 3, 7),
                new DateOnly(2022, 3, 15),
                new DateOnly(2022, 3, 23));
        }

        [TestMethod]
        public void TestMultipleStagesBeforeInAndAfterOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 3, 15),
                gap: new Timeline(new DateTime(2022, 1, 10), DateTime.MaxValue),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)>.Empty
                .Add((TimeSpan.FromDays(2), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 10), new DateTime(2022, 1, 31))))
                .Add((TimeSpan.FromDays(4), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 1, 31), new DateTime(2022, 2, 28))))
                .Add((TimeSpan.FromDays(8), timeSpan: new AbsoluteTimeSpan(new DateTime(2022, 2, 28), DateTime.MaxValue))));

            AssertEx.SequenceIs(result,
                new DateOnly(2022, 1, 12),
                new DateOnly(2022, 1, 14),
                new DateOnly(2022, 1, 16),
                new DateOnly(2022, 1, 18),
                new DateOnly(2022, 1, 20),
                new DateOnly(2022, 1, 22),
                new DateOnly(2022, 1, 24),
                new DateOnly(2022, 1, 26),
                new DateOnly(2022, 1, 28),
                new DateOnly(2022, 1, 30),
                new DateOnly(2022, 2, 3),
                new DateOnly(2022, 2, 7),
                new DateOnly(2022, 2, 11),
                new DateOnly(2022, 2, 15),
                new DateOnly(2022, 2, 19),
                new DateOnly(2022, 2, 23),
                new DateOnly(2022, 2, 27),
                new DateOnly(2022, 3, 7),
                new DateOnly(2022, 3, 15),
                new DateOnly(2022, 3, 23));
        }
    }
}
