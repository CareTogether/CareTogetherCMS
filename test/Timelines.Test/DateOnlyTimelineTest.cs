using System;
using System.Collections.Immutable;
using System.Linq;

namespace Timelines.Test;

[TestClass]
public class DateOnlyTimelineTest
{
    private static DateOnly D(int day) => new(2024, 1, day);
    private static DateRange DR(int start, int end) => new(D(start), D(end));
    private static DateRange DR(int start) => new(D(start), DateOnly.MaxValue);
    // private static TimeSpan T(int days) => TimeSpan.FromDays(days);
    // private static AbsoluteDateSpan M(int start, int end) =>
    //     new AbsoluteDateSpan(D(start), D(end));
    // private static AbsoluteDateSpan MMax(int start) =>
    //     new AbsoluteDateSpan(D(start), DateOnly.MaxValue);
    // private static AbsoluteDateSpan MMaxMax =
    //     new AbsoluteDateSpan(DateOnly.MaxValue, DateOnly.MaxValue);
    // private static DateOnlyTimeline DOTL(params (int start, int? end)[] stages) =>
    //     new DateOnlyTimeline(stages.Select(stage => new TerminatingStage(
    //         Start: D(stage.start),
    //         End: stage.end.HasValue ? D(stage.end.Value) : DateOnly.MaxValue))
    //         .ToImmutableList());


    [TestMethod]
    public void TestSingleZeroDurationTerminatingStage()
    {
        var dut = DateOnlyTimeline.UnionOf(ImmutableList.Create(
            DR(1, 1)));

        Assert.IsNotNull(dut);
        Assert.IsTrue(dut.Contains(D(1)));
        Assert.IsFalse(dut.Contains(D(2)));
        Assert.IsFalse(dut.Contains(D(9)));
        Assert.IsFalse(dut.Contains(D(10)));
        Assert.IsFalse(dut.Contains(D(11)));
        Assert.IsFalse(dut.Contains(D(19)));
        Assert.IsFalse(dut.Contains(D(20)));
        Assert.IsFalse(dut.Contains(D(21)));
        Assert.IsFalse(dut.Contains(D(25)));
        Assert.IsFalse(dut.Contains(D(30)));
        Assert.IsFalse(dut.Contains(D(31)));

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(1)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(9)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(10)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(11)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(20)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(25)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(30)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(35)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(MMax(1), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 1)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 6)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 1)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 8)), dut.Subset(D(8), null));

        // Assert.IsNull(dut.TryMapFrom(D(7), T(3)));
        // Assert.IsNull(dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(10)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(11)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(20)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(25)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(30)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(35)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(MMax(9), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(MMax(10), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 10)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 10)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.IsNull(dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        // Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(20)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(25)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(30)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(MMax(12), dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(MMax(12), dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 10), (10, 15)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 10), (10, 20)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 10), (10, 20)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(D(21), dut.MapUnbounded(T(10)));
        // Assert.AreEqual(D(22), dut.MapUnbounded(T(11)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(20)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(25)));
        // Assert.AreEqual(DateOnly.MaxValue, dut.MapUnbounded(T(30)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(M(9, 24), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(M(10, 25), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(MMax(22), dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(MMax(22), dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 10), (20, 26)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 10), (20, 30)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.AreEqual(D(22), dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        // Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        // Assert.AreEqual(D(21), dut.MapUnbounded(T(20)));
        // Assert.AreEqual(D(26), dut.MapUnbounded(T(25)));
        // Assert.AreEqual(D(31), dut.MapUnbounded(T(30)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(M(12, 22), dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(M(12, 31), dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 15)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 26)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, null)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        // Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        // Assert.AreEqual(D(21), dut.MapUnbounded(T(20)));
        // Assert.AreEqual(D(26), dut.MapUnbounded(T(25)));
        // Assert.AreEqual(D(31), dut.MapUnbounded(T(30)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(M(12, 22), dut.MapUnbounded(T(11), T(10)));
        // Assert.AreEqual(M(12, 31), dut.MapUnbounded(T(11), T(19)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 10), (10, 15)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 10), (10, 26)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 10), (10, null)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
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

        // Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        // Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        // Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        // Assert.AreEqual(D(21), dut.MapUnbounded(T(10)));
        // Assert.AreEqual(D(22), dut.MapUnbounded(T(11)));
        // Assert.AreEqual(D(31), dut.MapUnbounded(T(20)));

        // Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        // Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        // Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        // Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        // Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        // Assert.AreEqual(M(9, 24), dut.MapUnbounded(T(8), T(5)));
        // Assert.AreEqual(M(10, 25), dut.MapUnbounded(T(9), T(5)));
        // Assert.AreEqual(M(22, 31), dut.MapUnbounded(T(11), T(9)));

        // Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        // Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        // Assert.AreEqual(TL((1, 10), (20, 26)), dut.Subset(D(1), D(26)));
        // Assert.AreEqual(TL((8, 10), (20, null)), dut.Subset(D(8), null));

        // Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        // Assert.AreEqual(D(22), dut.TryMapFrom(D(7), T(5)));
    }

    //TODO: Exhaustive unit tests for other DateOnlyTimeline methods!!!
}
