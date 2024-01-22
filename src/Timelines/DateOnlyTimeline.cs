using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;

namespace Timelines;

public readonly struct DateRange : IEquatable<DateRange>
{
    public readonly DateOnly Start;
    public readonly DateOnly End;


    public DateRange(DateOnly start, DateOnly end)
    {
        if (start > end)
            throw new ArgumentException("The start date must be on or before the end date.");

        Start = start;
        End = end;
    }


    public bool Contains(DateOnly value) =>
        value >= Start && value <= End;

    /// <summary>
    /// Calculates the intersection of this date range with the given date range,
    /// or 'null' if there is no intersection. The intersection is from the later
    /// of the start dates to the earlier of the end dates.
    /// </summary>
    public DateRange? IntersectionWith(DateRange? other)
    {
        if (other == null)
            return null;

        if (Start > other.Value.End || End < other.Value.Start)
            return null;

        return new DateRange(
            Start > other.Value.Start ? Start : other.Value.Start,
            End < other.Value.End ? End : other.Value.End);
    }


    public bool Equals(DateRange other)
    {
        return Start == other.Start && End == other.End;
    }

    public override bool Equals([NotNullWhen(true)] object? obj)
    {
        if (obj is DateRange other)
            return Equals(other);

        return base.Equals(obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Start, End);
    }

    public override string ToString()
    {
        return $"{Start:yyyyMMdd}-{End:yyyyMMdd}";
    }
}

/// <summary>
/// The <see cref="DateOnlyTimeline"/> class simplifies temporal calculations by
/// mapping high-level concepts like durations and intervals onto
/// potentially-discontinuous underlying time segments.
/// NOTE: Unlike the <see cref="Timeline"/> class, this class only considers
///      dates, not times.
/// </summary>
public sealed class DateOnlyTimeline
{
    public ImmutableList<DateRange> Ranges { get; init; }


    public DateOnlyTimeline(ImmutableList<DateRange> ranges)
    {
        if (ranges.Count == 0)
            throw new ArgumentException("At least one date range is required.");

        // Store the stages in chronological order.
        //TODO: This could be optimized if we know that the input is already ordered.
        Ranges = ranges.OrderBy(range => range.Start).ToImmutableList();

        // Validate that the ordered stages are non-overlapping.
        for (var i = 1; i < Ranges.Count; i++)
        {
            var prior = Ranges[i - 1];
            var current = Ranges[i];

            if (prior.End >= current.Start)
                throw new ArgumentException("The date ranges must not overlap. Overlap detected between " +
                    $"{prior} and {current}.");
        }
    }


    public static DateOnlyTimeline? UnionOf(ImmutableList<DateOnlyTimeline?> timelines)
    {
        var allRanges = timelines
            .Where(timeline => timeline != null)
            .SelectMany(timeline => timeline!.Ranges)
            .Cast<DateRange?>()
            .ToImmutableList();

        return UnionOf(allRanges);
    }

    public static DateOnlyTimeline? UnionOf(ImmutableList<DateRange?> ranges)
    {
        if (ranges.Count == 0 || ranges.All(range => range == null))
            return null;

        var nonNullRanges = ranges
            .Where(range => range != null)
            .Cast<DateRange>()
            .ToImmutableList();

        return UnionOf(nonNullRanges);
    }

    public static DateOnlyTimeline? UnionOf(ImmutableList<DateRange> ranges)
    {
        if (ranges.Count == 0)
            return null;

        var orderedAbsoluteRanges = ranges
            .OrderBy(range => range.Start)
            .ToImmutableList();

        // Merge any overlapping ranges, i.e., whenever the end of one range is on,
        // adjacent to, or after the start of the next range, combine them into a single range.
        var sequentialNonOverlappingRanges = orderedAbsoluteRanges
            .Aggregate(new List<DateRange>(), (prior, current) =>
            {
                if (prior.Count == 0)
                {
                    prior.Add(current);
                    return prior;
                }

                var mostRecentRange = prior[^1];
                if (current.Start <= mostRecentRange.End.AddDays(1))
                {
                    // The resulting range should use the end date of whichever range ends later.
                    prior[^1] = new DateRange(mostRecentRange.Start,
                        mostRecentRange.End > current.End ? mostRecentRange.End : current.End);
                    return prior;
                }

                prior.Add(current);
                return prior;
            })
            .ToImmutableList();

        return new DateOnlyTimeline(sequentialNonOverlappingRanges);
    }

    public static DateOnlyTimeline? IntersectionOf(ImmutableList<DateOnlyTimeline?> timelines)
    {
        // Find the intersection of all the timelines by calculating the time spans in which
        // all the given timelines overlap each other. As a way to simplify this problem,
        // any such intersection must consist at most of all the time spans in the first timeline.
        // Similarly, any such intersection must consist at most of all the time spans in the
        // second timeline, and so on. So, we can find the intersection by finding the intersection
        // of the first two timelines, then finding the intersection of that result and the next, etc.
        // A couple of base cases emerge from this:
        // 1. If there are no timelines, the intersection is empty.
        // 2. If there is only one timeline, the intersection is that timeline (which might be null).
        // 3. If any of the timelines are null, the intersection is empty.

        if (timelines.Count == 0)
            return null;

        if (timelines.Count == 1)
            return timelines[0];

        if (timelines.Any(timeline => timeline == null))
            return null;

        var intersection = timelines
            .Skip(1).Aggregate(timelines[0],
                (prior, current) => prior?.IntersectionWith(current));

        return intersection;
    }


    public bool Contains(DateOnly value) =>
        Ranges.Exists(range => range.Contains(value));

    public DateOnlyTimeline? IntersectionWith(DateRange other)
    {
        // Find the intersection of each range in the timeline with the 'other' range,
        // and then combine the results as a union. Some or all of the intersections
        // may be null, so the final result may be null.
        var rangeIntersections = Ranges
            .Select(range => range.IntersectionWith(other))
            .ToImmutableList();

        return UnionOf(rangeIntersections);
    }

    public DateOnlyTimeline? IntersectionWith(DateOnlyTimeline? other)
    {
        if (other == null)
            return null;

        // Find the intersection of two timelines by calculating the time spans in which
        // both timelines overlap each other. As a way to simplify this problem,
        // any such intersection must consist at most of all the time spans in the first timeline.
        // So, we can find the intersection by finding the intersection of each stage in the first
        // timeline with the second timeline, then combining the results as a union.
        var intersections = other.Ranges
            .Select(otherRange => IntersectionWith(otherRange))
            .ToImmutableList();

        return UnionOf(intersections);
    }
}
