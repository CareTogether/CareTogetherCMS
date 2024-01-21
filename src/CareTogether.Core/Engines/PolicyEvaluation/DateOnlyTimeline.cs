using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal abstract record TimelineStage();
    //TODO: Add validation that the end date is >= the start date?
    internal sealed record TerminatingStage(DateOnly Start, DateOnly End)
        : TimelineStage();
    internal sealed record NonTerminatingStage(DateOnly Start)
        : TimelineStage();

    //TODO: Add validation that the end date is >= the start date?
    internal sealed record AbsoluteDateSpan(DateOnly Start, DateOnly End)
    {
        public int Duration => End.DayNumber - Start.DayNumber;
    }

    /// <summary>
    /// The <see cref="DateOnlyTimeline"/> class simplifies temporal calculations by
    /// mapping high-level concepts like durations and intervals onto
    /// potentially-discontinuous underlying time segments.
    /// NOTE: Unlike the <see cref="Timeline"/> class, this class only considers
    ///      dates, not times.
    /// </summary>
    internal sealed class DateOnlyTimeline : IEquatable<DateOnlyTimeline?>
    {
        private readonly ImmutableList<AbsoluteDateSpan> stages;


        public DateOnly Start => stages.First().Start;

        public DateOnly End => stages.Last().End;


        // public DateOnlyTimeline(DateOnly start, DateOnly end)
        //     : this(ImmutableList.Create(new TerminatingStage(start, end)))
        // { }

        // public DateOnlyTimeline(ImmutableList<TerminatingStage> terminatingStages)
        // {
        //     if (terminatingStages.Count == 0)
        //         throw new ArgumentException("At least one timeline stage is required.");

        //     if (terminatingStages.Any(stage => stage.End < stage.Start))
        //         throw new ArgumentException("All timeline stages must have start dates before their end dates.");

        //     //TODO: Validate that the stages are non-overlapping?

        //     stages = terminatingStages
        //         .Select(stage => new AbsoluteDateSpan(stage.Start, stage.End))
        //         .ToImmutableList();
        // }

        // public DateOnlyTimeline(ImmutableList<TerminatingStage> terminatingStages,
        //     NonTerminatingStage nonTerminatingStage)
        //     : this(terminatingStages
        //         .Select(stage => new AbsoluteDateSpan(stage.Start, stage.End))
        //         .Append(new AbsoluteDateSpan(nonTerminatingStage.Start, DateOnly.MaxValue))
        //         .ToImmutableList())
        // { }

        private DateOnlyTimeline(ImmutableList<AbsoluteDateSpan> stages)
        {
            //TODO: Validate stage invariants (sequential start & end, sequential stages)

            this.stages = stages;
        }


        public static DateOnlyTimeline? Union(ImmutableList<TimelineStage> stages)
        {
            if (stages.Count == 0)
                return null;

            var orderedAbsoluteStages = stages
                .Select(stage => stage switch
                {
                    TerminatingStage terminatingStage =>
                        new AbsoluteDateSpan(terminatingStage.Start, terminatingStage.End),
                    NonTerminatingStage nonTerminatingStage =>
                        new AbsoluteDateSpan(nonTerminatingStage.Start, DateOnly.MaxValue),
                    _ => throw new NotImplementedException(
                        $"The timeline stage type '{stage.GetType().FullName}' has not been implemented.")
                })
                .OrderBy(stage => stage.Start)
                .ToImmutableList();

            // Merge any overlapping stages, i.e., whenever the end of one stage is on or
            // after the start of the next stage, combine them into a single stage.
            var sequentialNonOverlappingStages = orderedAbsoluteStages
                .Aggregate(new List<AbsoluteDateSpan>(), (prior, current) =>
                {
                    if (prior.Count == 0)
                    {
                        prior.Add(current);
                        return prior;
                    }

                    var mostRecentStage = prior[^1];
                    if (current.Start <= mostRecentStage.End)
                    {
                        prior[^1] = new AbsoluteDateSpan(mostRecentStage.Start, current.End);
                        return prior;
                    }

                    prior.Add(current);
                    return prior;
                })
                .ToImmutableList();

            return new DateOnlyTimeline(sequentialNonOverlappingStages);
        }


        public bool Contains(DateOnly value) =>
            stages.Exists(stage =>
                stage.Start <= value && stage.End >= value);

        // public AbsoluteTimeSpan MapUnbounded(TimeSpan startDelay, TimeSpan duration)
        // {
        //     var start = MapUnbounded(startDelay);
        //     var end = MapUnbounded(startDelay + duration);

        //     return new AbsoluteTimeSpan(start, end);
        // }

        // public DateTime? TryMapFrom(DateTime offset, TimeSpan duration)
        // {
        //     try
        //     {
        //         var subsetFromOffset = Subset(offset, DateTime.MaxValue);
        //         var mappedDurationInSubset = subsetFromOffset.TryMap(duration);
        //         return mappedDurationInSubset;
        //     }
        //     catch
        //     {
        //         return null;
        //     }
        // }

        // public DateTime MapUnbounded(TimeSpan durationFromStart)
        // {
        //     var result = TryMap(durationFromStart);

        //     if (result == null)
        //         return DateTime.MaxValue;

        //     return result.Value;
        // }

        // public DateTime? TryMap(TimeSpan durationFromStart)
        // {
        //     DateTime? mappedStageStartDate = null;
        //     TimeSpan mappedDurationPriorToCurrentStage = TimeSpan.Zero;

        //     foreach (var stage in stages)
        //     {
        //         if (stage.Duration + mappedDurationPriorToCurrentStage >= durationFromStart)
        //         {
        //             mappedStageStartDate = stage.Start;
        //             break;
        //         }
        //         else
        //             mappedDurationPriorToCurrentStage += stage.Duration;
        //     }

        //     if (mappedStageStartDate == null)
        //         return null;

        //     return mappedStageStartDate +
        //         durationFromStart - mappedDurationPriorToCurrentStage;
        // }

        // public Timeline Subset(DateTime start, DateTime? end)
        // {
        //     var subsetEnd = end.HasValue ? end.Value : DateTime.MaxValue;

        //     var subsetStages = stages
        //         .Where(stage => stage.Start <= subsetEnd && stage.End >= start)
        //         .Select(stage => new TerminatingTimelineStage(
        //             Start: start > stage.Start ? start : stage.Start,
        //             End: subsetEnd < stage.End ? subsetEnd : stage.End))
        //         .ToImmutableList();

        //     // To protect against invalid timelines when the subset is empty,
        //     // return a single-instant timeline starting at the requested start date.
        //     return subsetStages.Count == 0
        //         ? new Timeline(start, start)
        //         : new Timeline(subsetStages);
        // }

        public override bool Equals(object? obj)
        {
            return Equals(obj as DateOnlyTimeline);
        }

        public bool Equals(DateOnlyTimeline? other)
        {
            return other != null && stages.SequenceEqual(other.stages);
        }

        public override int GetHashCode()
        {
            return stages.GetHashCode();
        }
    }
}
