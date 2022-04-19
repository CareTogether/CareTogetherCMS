using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal sealed record TerminatingTimelineStage(DateTime Start, DateTime End);
    internal sealed record NonTerminatingTimelineStage(DateTime Start);

    internal sealed record AbsoluteTimeSpan(DateTime Start, DateTime End)
    {
        public TimeSpan Duration => End - Start;
    }

    /// <summary>
    /// The <see cref="Timeline"/> class simplifies temporal calculations by
    /// mapping high-level concepts like durations and intervals onto
    /// potentially-discontinuous underlying time segments.
    /// </summary>
    internal sealed class Timeline : IEquatable<Timeline?>
    {
        private readonly ImmutableList<AbsoluteTimeSpan> stages;


        public DateTime Start =>
            stages.First().Start;

        public DateTime? End =>
            stages.Last().End == DateTime.MaxValue ? null : stages.Last().End;


        public Timeline(DateTime start, DateTime end)
            : this(ImmutableList.Create(new TerminatingTimelineStage(start, end)))
        { }

        public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages)
        {
            if (terminatingStages.Count == 0)
                throw new ArgumentException("At least one timeline stage is required.");

            stages = terminatingStages
                .Select(stage => new AbsoluteTimeSpan(stage.Start, stage.End))
                .ToImmutableList();
        }

        public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages,
            NonTerminatingTimelineStage nonTerminatingStage)
            : this(terminatingStages
                .Select(stage => new AbsoluteTimeSpan(stage.Start, stage.End))
                .Append(new AbsoluteTimeSpan(nonTerminatingStage.Start, DateTime.MaxValue))
                .ToImmutableList())
        { }

        private Timeline(ImmutableList<AbsoluteTimeSpan> stages)
        {
            //TODO: Validate stage invariants (sequential start & end, sequential stages)

            this.stages = stages;
        }


        public bool Contains(DateTime value) =>
            stages.Exists(stage =>
                stage.Start <= value && stage.End >= value);

        public AbsoluteTimeSpan Map(TimeSpan startDelay, TimeSpan duration)
        {
            var start = Map(startDelay);
            var end = Map(startDelay + duration);
            
            return new AbsoluteTimeSpan(start, end);
        }

        public DateTime Map(TimeSpan durationFromStart)
        {
            DateTime? mappedStageStartDate = null;
            TimeSpan mappedDurationPriorToCurrentStage = TimeSpan.Zero;

            foreach (var stage in stages)
            {
                if (stage.Duration + mappedDurationPriorToCurrentStage >= durationFromStart)
                {
                    mappedStageStartDate = stage.Start;
                    break;
                }
                else
                    mappedDurationPriorToCurrentStage += stage.Duration;
            }

            if (mappedStageStartDate == null)
                throw new InvalidOperationException(
                    "The timeline is not long enough to accommodate mapping the requested date.");

            return (DateTime)(mappedStageStartDate!) +
                durationFromStart - mappedDurationPriorToCurrentStage;
        }

        public Timeline Subset(DateTime start, DateTime? end)
        {
            var subsetEnd = end.HasValue ? end.Value : DateTime.MaxValue;

            var subsetStages = stages
                .Where(stage => stage.Start < subsetEnd && stage.End > start)
                .Select(stage => new TerminatingTimelineStage(
                    Start: start > stage.Start ? start : stage.Start,
                    End: subsetEnd < stage.End ? subsetEnd : stage.End))
                .ToImmutableList();

            return new Timeline(subsetStages);
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as Timeline);
        }

        public bool Equals(Timeline? other)
        {
            return other != null && stages.SequenceEqual(other.stages);
        }

        public override int GetHashCode()
        {
            return stages.GetHashCode();
        }
    }
}
