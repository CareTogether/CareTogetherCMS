using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

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
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18));
        }

        [TestMethod]
        public void TestOneStageAroundClosedGapDateCurrentTimeIsWithin()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 15),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16));
        }

        [TestMethod]
        public void TestOneStageAroundClosedGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(7), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 17));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 20),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGapOneDayOffset()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 21),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22));
        }

        [TestMethod]
        public void TestOneStageAroundOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(7), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 17),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 31));
        }

        [TestMethod]
        public void TestOneStageEndingBeforeCurrentTimeOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(7), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 17),
                new DateTime(2022, 1, 24));
        }

        [TestMethod]
        public void TestOneStageWithClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 10), endDate: new DateTime(2022, 1, 31))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGapDateCurrentTimeIsWithin()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 15),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundClosedGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(7), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 17));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 20),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapOneDayOffset()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 21),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapLongerInterval()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(7), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 17),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 31));
        }

        [TestMethod]
        public void TestMultipleStagesFirstAroundOpenGapSecondIncluded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 2, 14),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 1), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 26),
                new DateTime(2022, 1, 28),
                new DateTime(2022, 1, 30),
                new DateTime(2022, 2, 3),
                new DateTime(2022, 2, 7),
                new DateTime(2022, 2, 11),
                new DateTime(2022, 2, 15));
        }

        [TestMethod]
        public void TestMultipleStagesFirstWithClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 1, 30),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 1, 20),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 10), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18));
        }

        [TestMethod]
        public void TestMultipleStagesFirstWithOpenGapSecondIncluded()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 2, 14),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 10), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28))));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 26),
                new DateTime(2022, 1, 28),
                new DateTime(2022, 1, 30),
                new DateTime(2022, 2, 3),
                new DateTime(2022, 2, 7),
                new DateTime(2022, 2, 11),
                new DateTime(2022, 2, 15));
        }

        [TestMethod]
        public void TestMultipleStagesBeforeInAndAfterClosedGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 3, 15),
                gapStart: new DateTime(2022, 1, 10), gapEnd: new DateTime(2022, 3, 31),
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 10), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28)))
                .Add((TimeSpan.FromDays(8), startDate: new DateTime(2022, 2, 28), endDate: null)));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 26),
                new DateTime(2022, 1, 28),
                new DateTime(2022, 1, 30),
                new DateTime(2022, 2, 3),
                new DateTime(2022, 2, 7),
                new DateTime(2022, 2, 11),
                new DateTime(2022, 2, 15),
                new DateTime(2022, 2, 19),
                new DateTime(2022, 2, 23),
                new DateTime(2022, 2, 27),
                new DateTime(2022, 3, 7),
                new DateTime(2022, 3, 15),
                new DateTime(2022, 3, 23));
        }

        [TestMethod]
        public void TestMultipleStagesBeforeInAndAfterOpenGap()
        {
            var result = ReferralCalculations.CalculateMissingMonitoringRequirementsWithinCompletionGap(
                utcNow: new DateTime(2022, 3, 15),
                gapStart: new DateTime(2022, 1, 10), gapEnd: null,
                arrangementStages: ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty
                .Add((TimeSpan.FromDays(2), startDate: new DateTime(2022, 1, 10), endDate: new DateTime(2022, 1, 31)))
                .Add((TimeSpan.FromDays(4), startDate: new DateTime(2022, 1, 31), endDate: new DateTime(2022, 2, 28)))
                .Add((TimeSpan.FromDays(8), startDate: new DateTime(2022, 2, 28), endDate: null)));

            AssertEx.SequenceIs(result,
                new DateTime(2022, 1, 12),
                new DateTime(2022, 1, 14),
                new DateTime(2022, 1, 16),
                new DateTime(2022, 1, 18),
                new DateTime(2022, 1, 20),
                new DateTime(2022, 1, 22),
                new DateTime(2022, 1, 24),
                new DateTime(2022, 1, 26),
                new DateTime(2022, 1, 28),
                new DateTime(2022, 1, 30),
                new DateTime(2022, 2, 3),
                new DateTime(2022, 2, 7),
                new DateTime(2022, 2, 11),
                new DateTime(2022, 2, 15),
                new DateTime(2022, 2, 19),
                new DateTime(2022, 2, 23),
                new DateTime(2022, 2, 27),
                new DateTime(2022, 3, 7),
                new DateTime(2022, 3, 15),
                new DateTime(2022, 3, 23));
        }
    }
}
