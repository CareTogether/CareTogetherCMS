using System.Collections.Immutable;

namespace Timelines.Test;

[TestClass]
public class TimelineTest
{
    private static DateTime D(int day) => new DateTime(2022, 1, day);

    private static TimeSpan T(int days) => TimeSpan.FromDays(days);

    private static AbsoluteTimeSpan M(int start, int end) => new AbsoluteTimeSpan(D(start), D(end));

    private static AbsoluteTimeSpan MMax(int start) =>
        new AbsoluteTimeSpan(D(start), DateTime.MaxValue);

    private static AbsoluteTimeSpan MMaxMax = new AbsoluteTimeSpan(
        DateTime.MaxValue,
        DateTime.MaxValue
    );

    private static Timeline TL(params (int start, int? end)[] stages) =>
        new Timeline(
            stages
                .Select(stage => new TerminatingTimelineStage(
                    Start: D(stage.start),
                    End: stage.end.HasValue ? D(stage.end.Value) : DateTime.MaxValue
                ))
                .ToImmutableList()
        );

    [TestMethod]
    public void TestSingleZeroDurationTerminatingStage()
    {
        var dut = new Timeline(ImmutableList.Create(new TerminatingTimelineStage(D(1), D(1))));

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(1)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(9)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(10)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(11)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(20)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(25)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(30)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(35)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(MMax(1), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 1)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 6)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 1)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 8)), dut.Subset(D(8), null));

        Assert.IsNull(dut.TryMapFrom(D(7), T(3)));
        Assert.IsNull(dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestSingleTerminatingStage()
    {
        var dut = new Timeline(ImmutableList.Create(new TerminatingTimelineStage(D(1), D(10))));

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(10)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(11)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(20)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(25)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(30)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(35)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(MMax(9), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(MMax(10), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(MMaxMax, dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 10)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 10)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.IsNull(dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestTwoContinuousTerminatingStages()
    {
        var dut = new Timeline(
            ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(10), D(20))
            )
        );

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(20)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(25)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(30)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(MMax(12), dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(MMax(12), dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 10), (10, 15)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 10), (10, 20)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 10), (10, 20)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestTwoDiscontinuousTerminatingStages()
    {
        var dut = new Timeline(
            ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(20), D(30))
            )
        );

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(D(21), dut.MapUnbounded(T(10)));
        Assert.AreEqual(D(22), dut.MapUnbounded(T(11)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(20)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(25)));
        Assert.AreEqual(DateTime.MaxValue, dut.MapUnbounded(T(30)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(M(9, 24), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(M(10, 25), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(MMax(22), dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(MMax(22), dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 10), (20, 26)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 10), (20, 30)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.AreEqual(D(22), dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestSingleNonTerminatingStage()
    {
        var dut = new Timeline(
            ImmutableList<TerminatingTimelineStage>.Empty,
            new NonTerminatingTimelineStage(D(1))
        );

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        Assert.AreEqual(D(21), dut.MapUnbounded(T(20)));
        Assert.AreEqual(D(26), dut.MapUnbounded(T(25)));
        Assert.AreEqual(D(31), dut.MapUnbounded(T(30)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(M(12, 22), dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(M(12, 31), dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 15)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 26)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, null)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestSingleTerminatingAndContinuousNonTerminatingStage()
    {
        var dut = new Timeline(
            ImmutableList.Create(new TerminatingTimelineStage(D(1), D(10))),
            new NonTerminatingTimelineStage(D(10))
        );

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(D(11), dut.MapUnbounded(T(10)));
        Assert.AreEqual(D(12), dut.MapUnbounded(T(11)));
        Assert.AreEqual(D(21), dut.MapUnbounded(T(20)));
        Assert.AreEqual(D(26), dut.MapUnbounded(T(25)));
        Assert.AreEqual(D(31), dut.MapUnbounded(T(30)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(M(9, 14), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(M(10, 15), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(M(12, 22), dut.MapUnbounded(T(11), T(10)));
        Assert.AreEqual(M(12, 31), dut.MapUnbounded(T(11), T(19)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 10), (10, 15)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 10), (10, 26)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 10), (10, null)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.AreEqual(D(12), dut.TryMapFrom(D(7), T(5)));
    }

    [TestMethod]
    public void TestSingleTerminatingAndDiscontinuousNonTerminatingStage()
    {
        var dut = new Timeline(
            ImmutableList.Create(new TerminatingTimelineStage(D(1), D(10))),
            new NonTerminatingTimelineStage(D(20))
        );

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

        Assert.AreEqual(D(1), dut.MapUnbounded(T(0)));
        Assert.AreEqual(D(2), dut.MapUnbounded(T(1)));
        Assert.AreEqual(D(10), dut.MapUnbounded(T(9)));
        Assert.AreEqual(D(21), dut.MapUnbounded(T(10)));
        Assert.AreEqual(D(22), dut.MapUnbounded(T(11)));
        Assert.AreEqual(D(31), dut.MapUnbounded(T(20)));

        Assert.AreEqual(M(1, 1), dut.MapUnbounded(T(0), T(0)));
        Assert.AreEqual(M(1, 2), dut.MapUnbounded(T(0), T(1)));
        Assert.AreEqual(M(2, 2), dut.MapUnbounded(T(1), T(0)));
        Assert.AreEqual(M(2, 3), dut.MapUnbounded(T(1), T(1)));
        Assert.AreEqual(M(2, 4), dut.MapUnbounded(T(1), T(2)));
        Assert.AreEqual(M(9, 24), dut.MapUnbounded(T(8), T(5)));
        Assert.AreEqual(M(10, 25), dut.MapUnbounded(T(9), T(5)));
        Assert.AreEqual(M(22, 31), dut.MapUnbounded(T(11), T(9)));

        Assert.AreEqual(TL((1, 5)), dut.Subset(D(1), D(5)));
        Assert.AreEqual(TL((6, 10)), dut.Subset(D(6), D(15)));
        Assert.AreEqual(TL((1, 10), (20, 26)), dut.Subset(D(1), D(26)));
        Assert.AreEqual(TL((8, 10), (20, null)), dut.Subset(D(8), null));

        Assert.AreEqual(D(10), dut.TryMapFrom(D(7), T(3)));
        Assert.AreEqual(D(22), dut.TryMapFrom(D(7), T(5)));
    }
}
