using System.Collections.Immutable;

namespace Timelines.Test;

[TestClass]
public class DateOnlyTimelineTest
{
    private static DateOnly D(int day) => new(2024, 1, day);
    private static DateRange DR(int start, int end) => new(D(start), D(end));
    private static DateRange DR(int start) => new(D(start), DateOnly.MaxValue);

    private static void AssertDatesAre(DateOnlyTimeline dut, params int[] dates)
    {
        // Set the max date to check to something past where we'll be testing.
        for (var i = 1; i < 20; i++)
            Assert.AreEqual(dates.Contains(i), dut.Contains(D(i)), $"Failed on {i}");
    }


    // TODO: Test DateOnlyTimeline instance methods

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




    //////////////////////////////////
    // TODO: Review subsequent tests

    [TestMethod]
    public void TestSingleZeroDurationTerminatingStage()
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
    public void TestSingleTerminatingStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 10)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsFalse(dut.Contains(D(11)));
        Assert.IsFalse(dut.Contains(D(19)));
        Assert.IsFalse(dut.Contains(D(20)));
        Assert.IsFalse(dut.Contains(D(21)));
        Assert.IsFalse(dut.Contains(D(25)));
        Assert.IsFalse(dut.Contains(D(30)));
        Assert.IsFalse(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestTwoContinuousTerminatingStages()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 10), DR(10, 20)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsTrue(dut.Contains(D(11)));
        Assert.IsTrue(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsFalse(dut.Contains(D(21)));
        Assert.IsFalse(dut.Contains(D(25)));
        Assert.IsFalse(dut.Contains(D(30)));
        Assert.IsFalse(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestTwoDiscontinuousTerminatingStages()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 10), DR(20, 30)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsFalse(dut.Contains(D(11)));
        Assert.IsFalse(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsTrue(dut.Contains(D(21)));
        Assert.IsTrue(dut.Contains(D(25)));
        Assert.IsTrue(dut.Contains(D(30)));
        Assert.IsFalse(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestTwoOverlappingTerminatingStages()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 15), DR(10, 20)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsTrue(dut.Contains(D(11)));
        Assert.IsTrue(dut.Contains(D(15)));
        Assert.IsTrue(dut.Contains(D(16)));
        Assert.IsTrue(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsFalse(dut.Contains(D(21)));
        Assert.IsFalse(dut.Contains(D(25)));
        Assert.IsFalse(dut.Contains(D(30)));
        Assert.IsFalse(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestSingleNonTerminatingStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsTrue(dut.Contains(D(11)));
        Assert.IsTrue(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsTrue(dut.Contains(D(21)));
        Assert.IsTrue(dut.Contains(D(25)));
        Assert.IsTrue(dut.Contains(D(30)));
        Assert.IsTrue(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestSingleTerminatingAndContinuousNonTerminatingStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 10), DR(10)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsTrue(dut.Contains(D(11)));
        Assert.IsTrue(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsTrue(dut.Contains(D(21)));
        Assert.IsTrue(dut.Contains(D(25)));
        Assert.IsTrue(dut.Contains(D(30)));
        Assert.IsTrue(dut.Contains(D(31)));
    }

    [TestMethod]
    public void TestSingleTerminatingAndDiscontinuousNonTerminatingStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 10), DR(20)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsTrue(dut.Contains(D(2)));
        Assert.IsTrue(dut.Contains(D(9)));
        Assert.IsTrue(dut.Contains(D(10)));
        Assert.IsFalse(dut.Contains(D(11)));
        Assert.IsFalse(dut.Contains(D(19)));
        Assert.IsTrue(dut.Contains(D(20)));
        Assert.IsTrue(dut.Contains(D(21)));
        Assert.IsTrue(dut.Contains(D(25)));
        Assert.IsTrue(dut.Contains(D(30)));
        Assert.IsTrue(dut.Contains(D(31)));
    }

    //TODO: Exhaustive unit tests for other DateOnlyTimeline methods!!!
}
