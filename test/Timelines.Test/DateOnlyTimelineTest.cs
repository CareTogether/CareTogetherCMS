using System.Collections.Immutable;

namespace Timelines.Test;

[TestClass]
public class DateOnlyTimelineTest
{
    private static DateOnly D(int day) => new(2024, 1, day);
    private static DateRange DR(int start, int end) => new(D(start), D(end));
    private static DateRange<T> DR<T>(int start, int end, T tag) => new(D(start), D(end), tag);

    private static void AssertDatesAre(DateOnlyTimeline dut, params int[] dates)
    {
        // Set the max date to check to something past where we'll be testing.
        for (var i = 1; i < 20; i++)
            Assert.AreEqual(dates.Contains(i), dut.Contains(D(i)), $"Failed on {i}");
    }


    [TestMethod]
    public void ConstructorForbidsEmptyList()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline(ImmutableList<DateRange>.Empty));
    }

    [TestMethod]
    public void ConstructorForbidsOverlappingRanges()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline([DR(1, 2), DR(2, 3)]));
    }

    [TestMethod]
    public void ConstructorForbidsOverlappingRanges2()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline([DR(1, 3), DR(2, 4)]));
    }

    [TestMethod]
    public void ConstructorPopulatesRanges()
    {
        var dut = new DateOnlyTimeline([DR(1, 2), DR(3, 4)]);

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 2), DR(3, 4)
        ]));
    }

    [TestMethod]
    public void UnionOfEmptyListReturnsNull()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange>.Empty);

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void UnionOfSingleOneDayStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 1)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void UnionOfMultipleOverlappingOneDayStages()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 1), DR(1, 1)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void UnionOfTwoContiguousOneDayStages()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 1), DR(2, 2)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1, 2);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 2)
        ]));
    }

    [TestMethod]
    public void UnionOfOneMultipleDayRange()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(2, 4)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 4);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 4)
        ]));
    }

    [TestMethod]
    public void UnionOfTwoDiscontinuousMultipleDayRanges()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(2, 3), DR(5, 5), DR(6, 8)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 5, 6, 7, 8);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 3), DR(5, 8)
        ]));
    }

    [TestMethod]
    public void UnionOfTwoOverlappingMultipleDayRanges()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(2, 5), DR(4, 7)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 7)
        ]));
    }

    [TestMethod]
    public void UnionOfTwoOverlappingMultipleDayRangesInReverseOrder()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(4, 7), DR(2, 5)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 7)
        ]));
    }

    [TestMethod]
    public void UnionOfTwoFullyOverlappingMultipleDayRanges()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(2, 7), DR(4, 5)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 4, 5, 6, 7);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 7)
        ]));
    }

    [TestMethod]
    public void UnionOfNullableEmptyListReturnsNull()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty);

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void UnionOfNullableNullElementReturnsNull()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty
            .Add(null));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void UnionOfNullableNullElementsReturnsNull()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty
            .AddRange([null, null]));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void UnionOfNullableSingleOneDayStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty
            .Add(DR(1, 1)));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void UnionOfNullableSingleOneDayStageWithNulls()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty
            .AddRange([null, DR(1, 1), null]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void UnionOfNullableTwoDiscontinuousMultipleDayRangesWithNulls()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateRange?>.Empty
            .AddRange([DR(2, 3), null, null, DR(5, 5), null, null, DR(6, 8), null]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2, 3, 5, 6, 7, 8);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 3), DR(5, 8)
        ]));
    }

    [TestMethod]
    public void UnionOfTimelinesReturnsNullIfAllNull()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateOnlyTimeline?>.Empty
            .AddRange([null, null]));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void UnionOfTimelinesReturnsUnionOfAllNonNullRanges()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList<DateOnlyTimeline?>.Empty
            .AddRange([
                null,
                DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(1, 1))),
                null,
                DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(2, 2))),
                DateOnlyTimeline.UnionOf(ImmutableList.Create(DR(4, 5))),
                null
            ]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1, 2, 4, 5);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 2), DR(4, 5)
        ]));
    }

    [TestMethod]
    public void IntersectionOfEmptyListReturnsNull()
    {
        var dut = DateOnlyTimeline.IntersectionOf([]);

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void IntersectionOfSingleOneDayTimeline()
    {
        var dut = DateOnlyTimeline.IntersectionOf(ImmutableList.Create([
            new DateOnlyTimeline([DR(1, 1)])
        ]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 1);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void IntersectionOfTwoOverlappingTimelines()
    {
        var dut = DateOnlyTimeline.IntersectionOf(ImmutableList.Create([
            new DateOnlyTimeline([DR(2, 2)]),
            new DateOnlyTimeline([DR(1, 3)])
        ]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 2)
        ]));
    }

    [TestMethod]
    public void IntersectionOfTwoOverlappingTimelinesAndNull()
    {
        var dut = DateOnlyTimeline.IntersectionOf(ImmutableList.Create([
            new DateOnlyTimeline([DR(2, 2)]),
            new DateOnlyTimeline([DR(1, 3)]),
            null
        ]));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void IntersectionOfThreeDisjointTimelines()
    {
        var dut = DateOnlyTimeline.IntersectionOf(ImmutableList.Create([
            new DateOnlyTimeline([DR(2, 2)]),
            new DateOnlyTimeline([DR(1, 3)]),
            new DateOnlyTimeline([DR(4, 4)])
        ]));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void IntersectionOfThreeOverlappingTimelines()
    {
        var dut = DateOnlyTimeline.IntersectionOf(ImmutableList.Create([
            new DateOnlyTimeline([DR(2, 2)]),
            new DateOnlyTimeline([DR(1, 3)]),
            new DateOnlyTimeline([DR(2, 4)])
        ]));

        Assert.IsNotNull(dut);
        AssertDatesAre(dut, 2);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(2, 2)
        ]));
    }

    [TestMethod]
    public void ContainsChecksAllRanges()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsFalse(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(3)));
        Assert.IsTrue(dut.Contains(D(4)));
        Assert.IsFalse(dut.Contains(D(5)));
    }

    [TestMethod]
    public void IntersectionWithNullReturnsNull()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);

        Assert.IsNull(dut.IntersectionWith(null));
    }

    [TestMethod]
    public void IntersectionWithDisjointTimelineReturnsNull()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var other = new DateOnlyTimeline([DR(5, 5), DR(7, 8)]);

        Assert.IsNull(dut.IntersectionWith(other));
    }

    [TestMethod]
    public void IntersectionWithOverlappingTimelineReturnsIntersection()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var other = new DateOnlyTimeline([DR(2, 3), DR(4, 5)]);

        var intersection = dut.IntersectionWith(other);

        Assert.IsNotNull(intersection);
        AssertDatesAre(intersection, 3, 4);
        Assert.IsTrue(intersection.Ranges.SequenceEqual([
            DR(3, 4)
        ]));
    }

    public void IntersectionWithDisjointDateRangeReturnsNull()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var other = DR(5, 5);

        Assert.IsNull(dut.IntersectionWith(other));
    }

    [TestMethod]
    public void IntersectionWithOverlappingDateRangeReturnsIntersection()
    {
        var dut = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var other = DR(2, 3);

        var intersection = dut.IntersectionWith(other);

        Assert.IsNotNull(intersection);
        AssertDatesAre(intersection, 3);
        Assert.IsTrue(intersection.Ranges.SequenceEqual([
            DR(3, 3)
        ]));
    }

    [TestMethod]
    public void ComplementOfNullIsAllOfTime()
    {
        var dut = DateOnlyTimeline.ComplementOf(null);

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ComplementOfAllOfTimeIsNull()
    {
        var input = new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, DateOnly.MaxValue)
        ]);
        var dut = DateOnlyTimeline.ComplementOf(input);

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void ComplementOfAllOfTimeIsNullViaInstanceMethod()
    {
        var input = new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, DateOnly.MaxValue)
        ]);
        var dut = input.Complement();

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void ComplementOfSingleRangeIsTwoRanges()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
            new DateRange(D(3).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ComplementOfTwoRangesIsThreeRanges()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3), DR(5, 5)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
            new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
            new DateRange(D(5).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ComplementOfTwoAdjacentRangesIsTwoRanges()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3), DR(4, 5)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
            new DateRange(D(5).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ComplementOfRangeBeforeBeginningOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, D(3))
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(3).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ComplementOfRangeAfterEndOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(D(1), DateOnly.MaxValue)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1))
        ]));
    }

    [TestMethod]
    public void ComplementOfSecondRangeAfterEndOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(D(1), D(3)),
            new DateRange(D(4), DateOnly.MaxValue)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1))
        ]));
    }

    [TestMethod]
    public void ComplementOfSecondRangeAfterEndOfTimeDoesNotExist2()
    {
        var input = new DateOnlyTimeline([
            new DateRange(D(1), D(2)),
            new DateRange(D(4), DateOnly.MaxValue)
        ]);
        var dut = input.Complement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(DateOnly.MinValue, D(1).AddDays(-1)),
            new DateRange(D(2).AddDays(1), D(4).AddDays(-1))
        ]));
    }

    [TestMethod]
    public void ForwardOnlyComplementOfAllOfTimeIsNull()
    {
        var input = new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, DateOnly.MaxValue)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void ForwardOnlyComplementOfSingleRangeIsOneRange()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(3).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ForwardOnlyComplementOfTwoRangesIsTwoRanges()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3), DR(5, 5)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
            new DateRange(D(5).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ForwardOnlyComplementOfTwoAdjacentRangesIsOneRange()
    {
        var input = new DateOnlyTimeline([
            DR(1, 3), DR(4, 5)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(5).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ForwardOnlyComplementOfRangeBeforeBeginningOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, D(3)),
            new DateRange(D(5), D(7))
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(3).AddDays(1), D(5).AddDays(-1)),
            new DateRange(D(7).AddDays(1), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void ForwardOnlyComplementOfRangeAfterEndOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(D(1), DateOnly.MaxValue)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void ForwardOnlyComplementOfSecondRangeAfterEndOfTimeDoesNotExist()
    {
        var input = new DateOnlyTimeline([
            new DateRange(D(1), D(2)),
            new DateRange(D(4), DateOnly.MaxValue)
        ]);
        var dut = input.ForwardOnlyComplement();

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            new DateRange(D(2).AddDays(1), D(4).AddDays(-1))
        ]));
    }

    [TestMethod]
    public void DifferenceWithNullReturnsTheOriginal()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(null);

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1), DR(3, 4)
        ]));
    }

    [TestMethod]
    public void DifferenceWithAllOfTimeReturnsNull()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(new DateOnlyTimeline([
            new DateRange(DateOnly.MinValue, DateOnly.MaxValue)
        ]));

        Assert.IsNull(dut);
    }

    [TestMethod]
    public void DifferenceWithDisjointRangesReturnsTheOriginal()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(new DateOnlyTimeline([DR(5, 7)]));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1), DR(3, 4)
        ]));
    }

    [TestMethod]
    public void DifferenceWithPartialOverlapExcludesTheSecondTimeline()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(new DateOnlyTimeline([DR(4, 7)]));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1), DR(3, 3)
        ]));
    }

    [TestMethod]
    public void DifferenceWithPartialOverlapExcludesTheSecondTimeline2()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(new DateOnlyTimeline([DR(2, 7)]));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 1)
        ]));
    }

    [TestMethod]
    public void DifferenceWithPartialOverlapExcludesTheSecondTimeline3()
    {
        var input = new DateOnlyTimeline([DR(1, 1), DR(3, 4)]);
        var dut = input.Difference(new DateOnlyTimeline([DR(1, 3)]));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(4, 4)
        ]));
    }

    [TestMethod]
    public void TaggedConstructorForbidsEmptyList()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline<char>(ImmutableList<DateRange<char>>.Empty));
    }

    [TestMethod]
    public void TaggedConstructorForbidsOverlappingRanges()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline<char>([DR(1, 2, 'A'), DR(2, 3, 'A')]));
    }

    [TestMethod]
    public void TaggedConstructorForbidsOverlappingRanges2()
    {
        Assert.ThrowsException<ArgumentException>(() =>
            new DateOnlyTimeline<char>([DR(1, 3, 'A'), DR(2, 4, 'A')]));
    }

    [TestMethod]
    public void TaggedConstructorPopulatesRanges()
    {
        var dut = new DateOnlyTimeline<char>([DR(1, 2, 'A'), DR(3, 4, 'B')]);

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Ranges.SequenceEqual([
            DR(1, 2, 'A'), DR(3, 4, 'B')
        ]));
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
        var dut = new DateOnlyTimeline<char>([DR(2, 4, 'A'), DR(6, 6, 'B')]);

        Assert.AreEqual(expected, dut.ValueAt(D(day)));
    }
}
