using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;

namespace Timelines
{
    /// <summary>
    /// The <see cref="DateOnlyTimeline"/> class simplifies temporal calculations by
    /// mapping high-level concepts like durations and intervals onto
    /// potentially-discontinuous underlying time segments.
    /// NOTE: Unlike the <see cref="Timeline"/> class, this class only considers
    ///      dates, not times.
    /// </summary>
    public sealed class DateOnlyTimeline : IEquatable<DateOnlyTimeline>
    {
        public ImmutableList<DateRange> Ranges { get; init; }

        public DateOnlyTimeline(ImmutableList<DateRange> ranges)
        {
            if (ranges.Count == 0)
            {
                throw new ArgumentException("At least one date range is required.");
            }

            // Store the stages in chronological order.

            Ranges = ranges.OrderBy(range => range.Start).ToImmutableList();

            // Validate that the ordered stages are non-overlapping.
            for (int i = 1; i < Ranges.Count; i++)
            {
                DateRange prior = Ranges[i - 1];
                DateRange current = Ranges[i];

                if (prior.End >= current.Start)
                {
                    throw new ArgumentException(
                        "The date ranges must not overlap. Overlap detected between " + $"{prior} and {current}."
                    );
                }
            }
        }

        public static DateOnlyTimeline FromOverlappingDateRanges(ImmutableList<DateRange> dateRanges)
        {
            ImmutableList<DateRange> mergedDateRanges = dateRanges.Aggregate(
                ImmutableList<DateRange>.Empty,
                (final, item) =>
                {
                    DateRange last = final.LastOrDefault();

                    if (last.End >= item.Start)
                    {
                        return final.Replace(last, new DateRange(last.Start, item.End));
                    }

                    return final.Add(item);
                }
            );

            return new DateOnlyTimeline(mergedDateRanges);
        }

        public DateOnly Start => Ranges.First().Start;

        public DateOnly End => Ranges.Last().End;

        public static DateOnlyTimeline? UnionOf(ImmutableList<DateOnlyTimeline?> timelines)
        {
            ImmutableList<DateRange?> allRanges = timelines
                .Where(timeline => timeline != null)
                .SelectMany(timeline => timeline!.Ranges)
                .Cast<DateRange?>()
                .ToImmutableList();

            return UnionOf(allRanges);
        }

        public static DateOnlyTimeline? UnionOf(ImmutableList<DateRange?> ranges)
        {
            if (ranges.Count == 0 || ranges.All(range => range == null))
            {
                return null;
            }

            ImmutableList<DateRange> nonNullRanges = ranges
                .Where(range => range != null)
                .Cast<DateRange>()
                .ToImmutableList();

            return UnionOf(nonNullRanges);
        }

        public static DateOnlyTimeline? UnionOf(ImmutableList<DateRange> ranges)
        {
            if (ranges.Count == 0)
            {
                return null;
            }

            ImmutableList<DateRange> orderedAbsoluteRanges = ranges.OrderBy(range => range.Start).ToImmutableList();

            // Merge any overlapping ranges, i.e., whenever the end of one range is on,
            // adjacent to, or after the start of the next range, combine them into a single range.
            ImmutableList<DateRange> sequentialNonOverlappingRanges = orderedAbsoluteRanges
                .Aggregate(
                    new List<DateRange>(),
                    (prior, current) =>
                    {
                        if (prior.Count == 0)
                        {
                            prior.Add(current);
                            return prior;
                        }

                        DateRange mostRecentRange = prior[^1];
                        if (mostRecentRange.End == DateOnly.MaxValue || current.Start <= mostRecentRange.End.AddDays(1))
                        {
                            // The resulting range should use the end date of whichever range ends later.
                            prior[^1] = new DateRange(
                                mostRecentRange.Start,
                                mostRecentRange.End > current.End ? mostRecentRange.End : current.End
                            );
                            return prior;
                        }

                        prior.Add(current);
                        return prior;
                    }
                )
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
            {
                return null;
            }

            if (timelines.Count == 1)
            {
                return timelines[0];
            }

            if (timelines.Any(timeline => timeline == null))
            {
                return null;
            }

            DateOnlyTimeline? intersection = timelines
                .Skip(1)
                .Aggregate(timelines[0], (prior, current) => prior?.IntersectionWith(current));

            return intersection;
        }

        public static DateOnlyTimeline? ComplementOf(DateOnlyTimeline? timeline)
        {
            // The complement of an empty timeline is a timeline that covers all dates.
            if (timeline == null)
            {
                return new DateOnlyTimeline(ImmutableList.Create(new DateRange(DateOnly.MinValue)));
            }

            return timeline.Complement();
        }

        public bool Contains(DateOnly value) => Ranges.Exists(range => range.Contains(value));

        public DateOnlyTimeline? IntersectionWith(DateRange other)
        {
            // Find the intersection of each range in the timeline with the 'other' range,
            // and then combine the results as a union. Some or all of the intersections
            // may be null, so the final result may be null.
            ImmutableList<DateRange?> rangeIntersections = Ranges
                .Select(range => range.IntersectionWith(other))
                .ToImmutableList();

            return UnionOf(rangeIntersections);
        }

        public DateOnlyTimeline? IntersectionWith(DateOnlyTimeline? other)
        {
            if (other == null)
            {
                return null;
            }

            // Find the intersection of two timelines by calculating the time spans in which
            // both timelines overlap each other. As a way to simplify this problem,
            // any such intersection must consist at most of all the time spans in the first timeline.
            // So, we can find the intersection by finding the intersection of each stage in the first
            // timeline with the second timeline, then combining the results as a union.

            ImmutableList<DateOnlyTimeline?> intersections = other.Ranges.Select(IntersectionWith).ToImmutableList();

            return UnionOf(intersections);
        }

        public DateOnlyTimeline? Complement()
        {
            // The complement of a timeline is a timeline that covers all dates not covered by the original.
            // This is the same as the union of all the ranges outside of the ranges in the original timeline.
            List<DateRange> complementRanges = new List<DateRange>();

            // To calculate the complement, start at the beginning of time and iterate through each range,
            // adding the range of dates between the end of the prior range and the start of the current range.
            // If there is no prior range, start at the beginning of time. If there is no current range,
            // end at the end of time.
            DateRange? priorRange = null;
            foreach (DateRange currentRange in Ranges)
            {
                if (currentRange.Start == DateOnly.MinValue)
                {
                    // If the current range starts at the beginning of time, skip it - there is no complement before it.
                    priorRange = currentRange;
                    continue;
                }
                else if (priorRange == null)
                {
                    // If this is the first range, add a range from the beginning of time to just before the start of this range.
                    complementRanges.Add(new DateRange(DateOnly.MinValue, currentRange.Start.AddDays(-1)));
                    priorRange = currentRange;
                    continue;
                }
                else if (priorRange.Value.End.AddDays(1) == currentRange.Start)
                {
                    // If this range is adjacent to the prior range, skip it - there is no complement range between it and the prior range.
                    priorRange = currentRange;
                    continue;
                }
                else
                {
                    // For all other ranges, add a range from just after the end of the prior range to just before the start of this range.
                    complementRanges.Add(
                        new DateRange(priorRange.Value.End.AddDays(1), currentRange.Start.AddDays(-1))
                    );
                    priorRange = currentRange;
                    continue;
                }
            }
            // INVARIANT: There should always have been at least one range in the current timeline.
            if (priorRange == null)
            {
                throw new InvalidOperationException("The timeline must contain at least one range.");
            }
            // Finally, if the last range ends before the end of time, add a range from just after the end of the last range to the end of time.

            if (priorRange.Value.End < DateOnly.MaxValue)
            {
                complementRanges.Add(new DateRange(priorRange.Value.End.AddDays(1), DateOnly.MaxValue));
            }

            return UnionOf(complementRanges.ToImmutableList());
        }

        public DateOnlyTimeline? ForwardOnlyComplement()
        {
            // The forward-only complement of a timeline is similar to a regular
            // complement (i.e., it covers all dates not covered by the original),
            // but it only includes dates after the first range in the original.
            // This is the same as the union of all the ranges outside of the ranges
            // in the original timeline, but only after the end of the first range.

            DateOnlyTimeline? fullComplement = Complement();
            if (fullComplement == null)
            {
                return null;
            }

            // If the first range in the original timeline starts at the beginning of time,
            // then the forward-only complement is the same as the regular complement.

            if (Ranges[0].Start == DateOnly.MinValue)
            {
                return fullComplement;
            }

            // Otherwise, the forward-only complement is the regular complement, but
            // with the first range removed.

            ImmutableList<DateRange> rangesAfterFirst = fullComplement.Ranges.Skip(1).ToImmutableList();
            return UnionOf(rangesAfterFirst);
        }

        public DateOnlyTimeline? Difference(DateOnlyTimeline? other)
        {
            if (other == null)
            {
                return this;
            }

            // The difference between two timelines is the intersection of the
            // first timeline with the complement of the second.

            return IntersectionWith(ComplementOf(other));
        }

        public bool Equals(DateOnlyTimeline? other)
        {
            return other != null && Ranges.SequenceEqual(other.Ranges);
        }

        public override bool Equals([NotNullWhen(true)] object? obj)
        {
            if (obj is DateOnlyTimeline other)
            {
                return Equals(other);
            }

            return base.Equals(obj);
        }

        public override int GetHashCode()
        {
            HashCode hashCode = new HashCode();
            foreach (DateRange range in Ranges)
            {
                hashCode.Add(range.GetHashCode());
            }

            return hashCode.ToHashCode();
        }

        /// <summary>
        /// Returns a new DateOnlyTimeline that includes up to the specified number of days from the start of this timeline.
        /// For discontinuous timelines, this will include ranges in order until the total length is reached.
        /// If the requested length is greater than or equal to the total days in this timeline, returns this timeline unchanged.
        /// </summary>
        /// <param name="requestedLength">The maximum number of days to include in the new timeline</param>
        /// <returns>A new DateOnlyTimeline containing up to the specified number of days from the start of this timeline</returns>
        /// <exception cref="ArgumentException">Thrown when requestedLength is not positive</exception>
        public DateOnlyTimeline? TakeDays(int requestedLength)
        {
            if (requestedLength <= 0)
            {
                throw new ArgumentException("Requested length must be positive.", nameof(requestedLength));
            }

            // If total length is already within limit, return unchanged

            int totalLength = Ranges.Sum(r => r.TotalDaysInclusive);
            if (totalLength <= requestedLength)
            {
                return this;
            }

            int remainingTotalLength = requestedLength;
            List<DateRange> newRanges = new List<DateRange>();

            foreach (DateRange range in Ranges)
            {
                if (remainingTotalLength <= 0)
                {
                    break;
                }

                // Only take part of this range up to remaining length

                DateRange newRange = range.TakeDays(remainingTotalLength);
                newRanges.Add(newRange);
                remainingTotalLength -= newRange.TotalDaysInclusive;
            }

            return new DateOnlyTimeline(newRanges.ToImmutableList());
        }

        /// <summary>
        /// Gets the total number of days in this timeline, inclusive of both the start and end dates of each range.
        /// For discontinuous timelines, this is the sum of the lengths of each range.
        /// </summary>
        /// <returns>The total number of days in this timeline</returns>
        public int TotalDaysInclusive()
        {
            return Ranges.Sum(range => range.TotalDaysInclusive);
        }
    }

    public sealed class DateOnlyTimeline<T> : IEquatable<DateOnlyTimeline<T>>
        where T : notnull
    {
        public ImmutableList<DateRange<T>> Ranges { get; init; }

        public DateOnlyTimeline(ImmutableList<DateRange<T>> ranges)
        {
            if (ranges.Count == 0)
            {
                throw new ArgumentException("At least one date range is required.");
            }

            // Store the stages in chronological order.

            Ranges = ranges.OrderBy(range => range.Start).ToImmutableList();

            // Validate that the ordered stages are non-overlapping.
            for (int i = 1; i < Ranges.Count; i++)
            {
                DateRange<T> prior = Ranges[i - 1];
                DateRange<T> current = Ranges[i];

                if (prior.End >= current.Start)
                {
                    throw new ArgumentException(
                        "The date ranges must not overlap. Overlap detected between " + $"{prior} and {current}."
                    );
                }
            }
        }

        public T? ValueAt(DateOnly value) =>
            // Because DateRange is a struct, the 'default' value is a range that has 'Tag' set to default(T).
            // That will be null for reference types, and the default value for value types.
            Ranges.SingleOrDefault(range => range.Contains(value)).Tag;

        public T? ValueAt(DateTime value) => ValueAt(DateOnly.FromDateTime(value));

        public bool Equals(DateOnlyTimeline<T>? other)
        {
            return other != null && Ranges.SequenceEqual(other.Ranges);
        }

        public override bool Equals([NotNullWhen(true)] object? obj)
        {
            if (obj is DateOnlyTimeline<T> other)
            {
                return Equals(other);
            }

            return base.Equals(obj);
        }

        public override int GetHashCode()
        {
            HashCode hashCode = new HashCode();
            foreach (DateRange<T> range in Ranges)
            {
                hashCode.Add(range.GetHashCode());
            }

            return hashCode.ToHashCode();
        }
    }
}
