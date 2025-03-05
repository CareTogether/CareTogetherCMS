using System.Collections.Immutable;

namespace Timelines.Test
{
    [TestClass]
    public class DateOnlyTimelineTest
    {
        static DateOnly D(int day)
        {
            return new(2024, 1, day);
        }

        static DateRange DR(int start, int end)
        {
            return new(D(start), D(end));
        }

        static DateRange<T> DR<T>(int start, int end, T tag)
        {
            return new(D(start), D(end), tag);
        }

        static void AssertDatesAre(DateOnlyTimeline dut, params int[] dates)
        {
            // Set the max date to check to something past where we'll be testing.
            for (int i = 1; i < 20; i++)
            {
                Assert.AreEqual(dates.Contains(i), dut.Contains(D(i)), $"Failed on {i}");
            }
        }

        [TestMethod]
        public void ConstructorForbidsEmptyList()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateOnlyTimeline(ImmutableList<DateRange>.Empty));
        }

        [TestMethod]
        public void ConstructorForbidsOverlappingRanges()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateOnlyTimeline([DR(1, 2), DR(2, 3)]));
        }

        [TestMethod]
        public void ConstructorForbidsOverlappingRanges2()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateOnlyTimeline([DR(1, 3), DR(2, 4)]));
        }

        [TestMethod]
        public void ConstructorPopulatesRanges()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 2), DR(3, 4)]);

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 2), DR(3, 4)]));
        }

        [TestMethod]
        public void CreateTimelineFromOverlappingDateRanges()
        {
            DateOnlyTimeline dut = DateOnlyTimeline.FromOverlappingDateRanges([DR(1, 2), DR(2, 4)]);

            Assert.AreEqual(dut, new DateOnlyTimeline([DR(1, 4)]));
        }

        [TestMethod]
        public void CreateTimelineFromOverlappingDateRangesWithNonOverlappingDateRanges()
        {
            DateOnlyTimeline dut = DateOnlyTimeline.FromOverlappingDateRanges([DR(1, 2), DR(4, 5)]);

            Assert.AreEqual(dut, new DateOnlyTimeline([DR(1, 2), DR(4, 5)]));
        }

        [TestMethod]
        public void TotalDaysInclusiveReturnsCorrectValue()
        {
            DateOnlyTimeline dut1 = new DateOnlyTimeline([DR(1, 1)]);
            DateOnlyTimeline dut2 = new DateOnlyTimeline([DR(1, 5)]);
            DateOnlyTimeline dut3 = new DateOnlyTimeline([DR(1, 2), DR(4, 5)]);

            Assert.AreEqual(1, dut1.TotalDaysInclusive());
            Assert.AreEqual(5, dut2.TotalDaysInclusive());
            Assert.AreEqual(4, dut3.TotalDaysInclusive());
        }

        [TestMethod]
        public void StartReturnsFirstDayOfFirstRange()
        {
            DateOnlyTimeline dut1 = new DateOnlyTimeline([DR(1, 5)]);
            DateOnlyTimeline dut2 = new DateOnlyTimeline([DR(3, 4), DR(6, 8)]);

            Assert.AreEqual(D(1), dut1.Start);
            Assert.AreEqual(D(3), dut2.Start);
        }

        [TestMethod]
        public void EndReturnsLastDayOfLastRange()
        {
            DateOnlyTimeline dut1 = new DateOnlyTimeline([DR(1, 5)]);
            DateOnlyTimeline dut2 = new DateOnlyTimeline([DR(3, 4), DR(6, 8)]);

            Assert.AreEqual(D(5), dut1.End);
            Assert.AreEqual(D(8), dut2.End);
        }

        [TestMethod]
        public void TakeDaysThrowsForNonPositiveValue()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 5)]);
            Assert.ThrowsException<ArgumentException>(() => dut.TakeDays(0));
            Assert.ThrowsException<ArgumentException>(() => dut.TakeDays(-1));
        }

        [TestMethod]
        public void TakeDaysReturnsOriginalTimelineWhenRequestedLengthExceedsTotal()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 3), DR(5, 6)]);
            DateOnlyTimeline? result = dut.TakeDays(10);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.Ranges.SequenceEqual([DR(1, 3), DR(5, 6)]));
        }

        [TestMethod]
        public void TakeDaysReturnsPartialTimelineWhenRequestedLengthIsLess()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 3), DR(5, 7)]);
            DateOnlyTimeline? result = dut.TakeDays(4);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.Ranges.SequenceEqual([DR(1, 3), DR(5, 5)]));
        }

        [TestMethod]
        public void TakeDaysHandlesSingleRange()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 5)]);
            DateOnlyTimeline? result = dut.TakeDays(3);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.Ranges.SequenceEqual([DR(1, 3)]));
        }

        [TestMethod]
        public void UnionOfEmptyListReturnsNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange>.Empty);

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void UnionOfSingleOneDayStage()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(1, 1)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void UnionOfMultipleOverlappingOneDayStages()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(1, 1), DR(1, 1)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void UnionOfTwoContiguousOneDayStages()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(1, 1), DR(2, 2)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1, 2);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 2)]));
        }

        [TestMethod]
        public void UnionOfOneMultipleDayRange()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 4)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 4);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 4)]));
        }

        [TestMethod]
        public void UnionOfTwoDiscontinuousMultipleDayRanges()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 3), DR(5, 5), DR(6, 8)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 5, 6, 7, 8);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 3), DR(5, 8)]));
        }

        [TestMethod]
        public void UnionOfTwoOverlappingMultipleDayRanges()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 5), DR(4, 7)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 7)]));
        }

        [TestMethod]
        public void UnionOfTwoOverlappingMultipleDayRangesInReverseOrder()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(4, 7), DR(2, 5)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 7)]));
        }

        [TestMethod]
        public void UnionOfTwoFullyOverlappingMultipleDayRanges()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 7), DR(4, 5)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 7)]));
        }

        [TestMethod]
        public void UnionOfNullableEmptyListReturnsNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty);

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void UnionOfNullableNullElementReturnsNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty.Add(null));

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void UnionOfNullableNullElementsReturnsNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty.AddRange([null, null]));

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void UnionOfNullableSingleOneDayStage()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty.Add(DR(1, 1)));

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void UnionOfNullableSingleOneDayStageWithNulls()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(
                ImmutableList<DateRange?>.Empty.AddRange([null, DR(1, 1), null])
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void UnionOfNullableTwoDiscontinuousMultipleDayRangesWithNulls()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(
                ImmutableList<DateRange?>.Empty.AddRange([DR(2, 3), null, null, DR(5, 5), null, null, DR(6, 8), null])
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2, 3, 5, 6, 7, 8);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 3), DR(5, 8)]));
        }

        [TestMethod]
        public void UnionOfTwoUnendingRangesReturnsSingleOverlappingRange()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(
                ImmutableList.Create(new DateRange(D(2), DateOnly.MaxValue), new DateRange(D(4), DateOnly.MaxValue))
            );

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(D(2), DateOnly.MaxValue)]));
        }

        [TestMethod]
        public void UnionOfTimelinesReturnsNullIfAllNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(
                ImmutableList<DateOnlyTimeline?>.Empty.AddRange([null, null])
            );

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void UnionOfTimelinesReturnsUnionOfAllNonNullRanges()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.UnionOf(
                ImmutableList<DateOnlyTimeline?>.Empty.AddRange(
                    [
                        null,
                        DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(1, 1))),
                        null,
                        DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 2))),
                        DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(4, 5))),
                        null,
                    ]
                )
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1, 2, 4, 5);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 2), DR(4, 5)]));
        }

        [TestMethod]
        public void IntersectionOfEmptyListReturnsNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf([]);

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void IntersectionOfSingleOneDayTimeline()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf(
                ImmutableList.Create<DateOnlyTimeline?>([new DateOnlyTimeline([DR(1, 1)])])
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 1);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void IntersectionOfTwoOverlappingTimelines()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf(
                ImmutableList.Create<DateOnlyTimeline?>(
                    [new DateOnlyTimeline([DR(2, 2)]), new DateOnlyTimeline([DR(1, 3)])]
                )
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 2)]));
        }

        [TestMethod]
        public void IntersectionOfTwoOverlappingTimelinesAndNull()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf(
                ImmutableList.Create([new DateOnlyTimeline([DR(2, 2)]), new DateOnlyTimeline([DR(1, 3)]), null])
            );

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void IntersectionOfThreeDisjointTimelines()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf(
                ImmutableList.Create<DateOnlyTimeline?>(
                    [
                        new DateOnlyTimeline([DR(2, 2)]),
                        new DateOnlyTimeline([DR(1, 3)]),
                        new DateOnlyTimeline([DR(4, 4)]),
                    ]
                )
            );

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void IntersectionOfThreeOverlappingTimelines()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.IntersectionOf(
                ImmutableList.Create<DateOnlyTimeline?>(
                    [
                        new DateOnlyTimeline([DR(2, 2)]),
                        new DateOnlyTimeline([DR(1, 3)]),
                        new DateOnlyTimeline([DR(2, 4)]),
                    ]
                )
            );

            Assert.IsNotNull(dut);
            AssertDatesAre(dut, 2);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(2, 2)]));
        }

        [TestMethod]
        public void ContainsChecksAllRanges()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsFalse(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(3)));
            Assert.IsTrue(dut.Contains(D(4)));
            Assert.IsFalse(dut.Contains(D(5)));
        }

        [TestMethod]
        public void IntersectionWithNullReturnsNull()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.IsNull(dut.IntersectionWith(null));
        }

        [TestMethod]
        public void IntersectionWithDisjointTimelineReturnsNull()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(5, 5), DR(7, 8)]);

            Assert.IsNull(dut.IntersectionWith(other));
        }

        [TestMethod]
        public void IntersectionWithOverlappingTimelineReturnsIntersection()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(2, 3), DR(4, 5)]);

            DateOnlyTimeline? intersection = dut.IntersectionWith(other);

            Assert.IsNotNull(intersection);
            AssertDatesAre(intersection, 3, 4);
            Assert.IsTrue(intersection.Ranges.SequenceEqual([DR(3, 4)]));
        }

        public void IntersectionWithDisjointDateRangeReturnsNull()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateRange other = DR(5, 5);

            Assert.IsNull(dut.IntersectionWith(other));
        }

        [TestMethod]
        public void IntersectionWithOverlappingDateRangeReturnsIntersection()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateRange other = DR(2, 3);

            DateOnlyTimeline? intersection = dut.IntersectionWith(other);

            Assert.IsNotNull(intersection);
            AssertDatesAre(intersection, 3);
            Assert.IsTrue(intersection.Ranges.SequenceEqual([DR(3, 3)]));
        }

        [TestMethod]
        public void ComplementOfNullIsAllOfTime()
        {
            DateOnlyTimeline? dut = DateOnlyTimeline.ComplementOf(null);

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(DateOnly.MinValue, DateOnly.MaxValue)]));
        }

        [TestMethod]
        public void ComplementOfAllOfTimeIsNull()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(DateOnly.MinValue, DateOnly.MaxValue)]);
            DateOnlyTimeline? dut = DateOnlyTimeline.ComplementOf(input);

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void ComplementOfAllOfTimeIsNullViaInstanceMethod()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(DateOnly.MinValue, DateOnly.MaxValue)]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void ComplementOfSingleRangeIsTwoRanges()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3)]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
                        new DateRange(D(3).AddDays(1), DateOnly.MaxValue),
                    ]
                )
            );
        }

        [TestMethod]
        public void ComplementOfTwoRangesIsThreeRanges()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3), DR(5, 5)]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
                        new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
                        new DateRange(D(5).AddDays(1), DateOnly.MaxValue),
                    ]
                )
            );
        }

        [TestMethod]
        public void ComplementOfTwoAdjacentRangesIsTwoRanges()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3), DR(4, 5)]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
                        new DateRange(D(5).AddDays(1), DateOnly.MaxValue),
                    ]
                )
            );
        }

        [TestMethod]
        public void ComplementOfRangeBeforeBeginningOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(DateOnly.MinValue, D(3))]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(D(3).AddDays(1), DateOnly.MaxValue)]));
        }

        [TestMethod]
        public void ComplementOfRangeAfterEndOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(D(1), DateOnly.MaxValue)]);
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(DateOnly.MinValue, D(1).AddDays(-1))]));
        }

        [TestMethod]
        public void ComplementOfSecondRangeAfterEndOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline(
                [new DateRange(D(1), D(3)), new DateRange(D(4), DateOnly.MaxValue)]
            );
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(DateOnly.MinValue, D(1).AddDays(-1))]));
        }

        [TestMethod]
        public void ComplementOfSecondRangeAfterEndOfTimeDoesNotExist2()
        {
            DateOnlyTimeline input = new DateOnlyTimeline(
                [new DateRange(D(1), D(2)), new DateRange(D(4), DateOnly.MaxValue)]
            );
            DateOnlyTimeline? dut = input.Complement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
                        new DateRange(D(2).AddDays(1), D(4).AddDays(-1)),
                    ]
                )
            );
        }

        [TestMethod]
        public void ForwardOnlyComplementOfAllOfTimeIsNull()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(DateOnly.MinValue, DateOnly.MaxValue)]);
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void ForwardOnlyComplementOfSingleRangeIsOneRange()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3)]);
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(D(3).AddDays(1), DateOnly.MaxValue)]));
        }

        [TestMethod]
        public void ForwardOnlyComplementOfTwoRangesIsTwoRanges()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3), DR(5, 5)]);
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
                        new DateRange(D(5).AddDays(1), DateOnly.MaxValue),
                    ]
                )
            );
        }

        [TestMethod]
        public void ForwardOnlyComplementOfTwoAdjacentRangesIsOneRange()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 3), DR(4, 5)]);
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(D(5).AddDays(1), DateOnly.MaxValue)]));
        }

        [TestMethod]
        public void ForwardOnlyComplementOfRangeBeforeBeginningOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline(
                [new DateRange(DateOnly.MinValue, D(3)), new DateRange(D(5), D(7))]
            );
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(
                dut.Ranges.SequenceEqual(
                    [
                        new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
                        new DateRange(D(7).AddDays(1), DateOnly.MaxValue),
                    ]
                )
            );
        }

        [TestMethod]
        public void ForwardOnlyComplementOfRangeAfterEndOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([new DateRange(D(1), DateOnly.MaxValue)]);
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void ForwardOnlyComplementOfSecondRangeAfterEndOfTimeDoesNotExist()
        {
            DateOnlyTimeline input = new DateOnlyTimeline(
                [new DateRange(D(1), D(2)), new DateRange(D(4), DateOnly.MaxValue)]
            );
            DateOnlyTimeline? dut = input.ForwardOnlyComplement();

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([new DateRange(D(2).AddDays(1), D(4).AddDays(-1))]));
        }

        [TestMethod]
        public void DifferenceWithNullReturnsTheOriginal()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(null);

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1), DR(3, 4)]));
        }

        [TestMethod]
        public void DifferenceWithAllOfTimeReturnsNull()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(
                new DateOnlyTimeline([new DateRange(DateOnly.MinValue, DateOnly.MaxValue)])
            );

            Assert.IsNull(dut);
        }

        [TestMethod]
        public void DifferenceWithDisjointRangesReturnsTheOriginal()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(new DateOnlyTimeline([DR(5, 7)]));

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1), DR(3, 4)]));
        }

        [TestMethod]
        public void DifferenceWithPartialOverlapExcludesTheOverlappedDates()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(new DateOnlyTimeline([DR(4, 7)]));

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1), DR(3, 3)]));
        }

        [TestMethod]
        public void DifferenceWithPartialOverlapExcludesTheOverlappedDates2()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(new DateOnlyTimeline([DR(2, 7)]));

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 1)]));
        }

        [TestMethod]
        public void DifferenceWithPartialOverlapExcludesTheOverlappedDates3()
        {
            DateOnlyTimeline input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline? dut = input.Difference(new DateOnlyTimeline([DR(1, 3)]));

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(4, 4)]));
        }

        [TestMethod]
        public void EqualsWithNullIsFalse()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.IsFalse(dut.Equals(null));
        }

        [TestMethod]
        public void EqualsWithArrayOfDateRangesIsFalse()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.IsFalse(dut.Equals(new DateRange[] { DR(1, 1), DR(3, 4) }));
        }

        [TestMethod]
        public void EqualsWithSameRangesIsTrue()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.IsTrue(dut.Equals(other));
        }

        [TestMethod]
        public void EqualsWithDifferentRangesIsFalse()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1), DR(3, 5)]);

            Assert.IsFalse(dut.Equals(other));
        }

        [TestMethod]
        public void EqualsWithDifferentRangesIsFalse2()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1)]);

            Assert.IsFalse(dut.Equals(other));
        }

        [TestMethod]
        public void GetHashCodeIsConsistent()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

            Assert.AreEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void GetHashCodeIsConsistent2()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1), DR(3, 5)]);

            Assert.AreNotEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void GetHashCodeIsConsistent3()
        {
            DateOnlyTimeline dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
            DateOnlyTimeline other = new DateOnlyTimeline([DR(1, 1)]);

            Assert.AreNotEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void TaggedConstructorForbidsEmptyList()
        {
            Assert.ThrowsException<ArgumentException>(
                () => new DateOnlyTimeline<char>(ImmutableList<DateRange<char>>.Empty)
            );
        }

        [TestMethod]
        public void TaggedConstructorForbidsOverlappingRanges()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateOnlyTimeline<char>([DR(1, 2, 'A'), DR(2, 3, 'A')]));
        }

        [TestMethod]
        public void TaggedConstructorForbidsOverlappingRanges2()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateOnlyTimeline<char>([DR(1, 3, 'A'), DR(2, 4, 'A')]));
        }

        [TestMethod]
        public void TaggedConstructorPopulatesRanges()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 2, 'A'), DR(3, 4, 'B')]);

            Assert.IsNotNull(dut);
            Assert.IsTrue(dut.Ranges.SequenceEqual([DR(1, 2, 'A'), DR(3, 4, 'B')]));
        }

        [DataRow(1, default(char))]
        [DataRow(2, 'A')]
        [DataRow(3, 'A')]
        [DataRow(4, 'A')]
        [DataRow(5, default(char))]
        [DataRow(6, 'B')]
        [DataRow(7, default(char))]
        [DataTestMethod]
        public void TaggedTimelineValuesAreCorrect(int day, char? expected)
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(2, 4, 'A'), DR(6, 6, 'B')]);

            Assert.AreEqual(expected, dut.ValueAt(D(day)));
        }

        [TestMethod]
        public void TaggedEqualsWithNullIsFalse()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);

            Assert.IsFalse(dut.Equals(null));
        }

        [TestMethod]
        public void TaggedEqualsWithArrayOfDateRangesIsFalse()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);

            Assert.IsFalse(dut.Equals(new DateRange<char>[] { DR(1, 1, 'A'), DR(3, 4, 'B') }));
        }

        [TestMethod]
        public void TaggedEqualsWithSameRangesIsTrue()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);

            Assert.IsTrue(dut.Equals(other));
        }

        [TestMethod]
        public void TaggedEqualsWithDifferentRangesIsFalse()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 5, 'B')]);

            Assert.IsFalse(dut.Equals(other));
        }

        [TestMethod]
        public void TaggedEqualsWithDifferentRangesIsFalse2()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A')]);

            Assert.IsFalse(dut.Equals(other));
        }

        [TestMethod]
        public void TaggedEqualsWithDifferentRangesIsFalse3()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'C')]);

            Assert.IsFalse(dut.Equals(other));
        }

        [TestMethod]
        public void TaggedGetHashCodeIsConsistent()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);

            Assert.AreEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeIsConsistent2()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 5, 'B')]);

            Assert.AreNotEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeIsConsistent3()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A')]);

            Assert.AreNotEqual(dut.GetHashCode(), other.GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeIsConsistent4()
        {
            DateOnlyTimeline<char> dut = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'B')]);
            DateOnlyTimeline<char> other = new DateOnlyTimeline<char>([DR(1, 1, 'A'), DR(3, 4, 'C')]);

            Assert.AreNotEqual(dut.GetHashCode(), other.GetHashCode());
        }
    }
}
