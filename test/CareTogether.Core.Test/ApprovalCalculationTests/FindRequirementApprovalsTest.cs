using System;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests;

[TestClass]
public class FindRequirementApprovalsTest
{
    [TestMethod]
    public void EmptyInputsReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.ExemptedOn([])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void EmptyInputsWithSupersededDateReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", H.DT(20),
            H.Completed([]),
            H.ExemptedOn([])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void NonMatchingInputsReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("B", 2), ("C", 3)]),
            H.ExemptedOn([("D", 4, null)])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void MatchingCompletedReturnsTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("A", 2)]),
            H.ExemptedOn([])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingCompletedMultipleReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("A", 2), ("A", 5)]),
            H.ExemptedOn([])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingCompletedExpiringReturnsTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.CompletedUntil([("A", 2, 4)]),
            H.ExemptedOn([])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), H.D(4))
        ]));
    }

    [TestMethod]
    public void MatchingCompletedExpiringNonoverlappingReturnsTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.CompletedUntil([("A", 2, 4), ("A", 6, 9)]),
            H.ExemptedOn([])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), H.D(4)),
            new DateRange(H.D(6), H.D(9))
        ]));
    }

    [TestMethod]
    public void MatchingCompletedExpiringOverlappingReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.CompletedUntil([("A", 2, 7), ("A", 6, 9)]),
            H.ExemptedOn([])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), H.D(9))
        ]));
    }

    [TestMethod]
    public void MatchingExemptedNonexpiringReturnsTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.ExemptedOn([("A", 3, null)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(3), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingExemptedNonexpiringMultipleReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.ExemptedOn([("A", 3, null), ("A", 6, null)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(3), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingCompletedAndExemptedNonexpiringMultipleReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("A", 2), ("A", 5)]),
            H.ExemptedOn([("A", 3, null), ("A", 6, null)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingExemptedExpiringReturnsTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.ExemptedOn([("A", 3, 6)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(3), H.D(6))
        ]));
    }

    [TestMethod]
    public void MatchingExemptedExpiringMultipleReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.ExemptedOn([("A", 3, 6), ("A", 7, 9)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(3), H.D(9))
        ]));
    }

    [TestMethod]
    public void MatchingCompletedAndExemptedExpiringMultipleReturnsSingleTimeline()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("A", 2), ("A", 5)]),
            H.ExemptedOn([("A", 3, 6), ("A", 6, 7)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(2), DateOnly.MaxValue)
        ]));
    }

    [TestMethod]
    public void MatchingCompletedOnlyAfterSupersededReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", H.DT(10),
            H.Completed([("A", 12), ("A", 15)]),
            H.ExemptedOn([])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void MatchingCompletedAndExemptedExpiringOnlyAfterSupersededReturnsExemptions()
    {
        //NOTE: Because exemptions cannot be backdated, this is the most straightforward logic:
        //      exemptions apply (as long as they are valid) regardless of policy supersedence.
        var result = SharedCalculations.FindRequirementApprovals(
            "A", H.DT(10),
            H.Completed([("A", 12), ("A", 15)]),
            H.ExemptedOn([("A", 13, 16), ("A", 16, 17)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(13), H.D(17))
        ]));
    }

    [TestMethod]
    public void MatchingWithSupersededReturnsOnlyNonsupersededRanges()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", H.DT(10),
            H.Completed([("A", 12), ("A", 15)]),
            H.ExemptedOn([("A", 5, 16), ("A", 16, 17)])
        );

        Assert.IsNotNull(result);
        Assert.IsTrue(result.Ranges.SequenceEqual([
            new DateRange(H.D(5), H.D(17))
        ]));
    }
}
