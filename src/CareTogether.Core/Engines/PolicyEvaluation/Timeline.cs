using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal sealed record TerminatingTimelineStage(DateTime Start, DateTime End)
    {
        public TimeSpan Duration => End - Start;
    }
    internal sealed record NonTerminatingTimelineStage(DateTime Start);

    internal sealed record AbsoluteTimeSpan(DateTime Start, DateTime End);

    /// <summary>
    /// The <see cref="Timeline"/> class simplifies temporal calculations by
    /// mapping high-level concepts like durations and intervals onto
    /// potentially-discontinuous underlying time segments.
    /// </summary>
    internal sealed class Timeline
    {
        private readonly ImmutableList<TerminatingTimelineStage> terminatingStages;
        private readonly NonTerminatingTimelineStage? nonTerminatingStage;


        public DateTime Start => terminatingStages.FirstOrDefault()?.Start ??
            nonTerminatingStage!.Start;

        public DateTime? End => terminatingStages.LastOrDefault()?.End;


        public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages)
        {
            this.terminatingStages = terminatingStages;
            this.nonTerminatingStage = null;
        }

        public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages,
            NonTerminatingTimelineStage nonTerminatingStage)
        {
            this.terminatingStages = terminatingStages;
            this.nonTerminatingStage = nonTerminatingStage;
        }


        public bool Contains(DateTime value) =>
            terminatingStages.Exists(stage =>
                stage.Start <= value && stage.End >= value) ||
            nonTerminatingStage?.Start <= value;

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

            foreach (var stage in terminatingStages)
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
            {
                if (nonTerminatingStage != null)
                    mappedStageStartDate = nonTerminatingStage.Start;
                else
                    throw new InvalidOperationException(
                        "The timeline is not long enough to accommodate mapping the requeste date.");
            }

            return (DateTime)(mappedStageStartDate!) +
                durationFromStart - mappedDurationPriorToCurrentStage;
        }

        public Timeline Subset(DateTime start, DateTime? end)
        {
            var terminatingSubset = terminatingStages
                .Where(stage => (stage.Start < end || !end.HasValue) && stage.End > start)
                .Select(stage => new TerminatingTimelineStage(
                    Start: start > stage.Start ? start : stage.Start,
                    End: end.HasValue ? (end < stage.End ? end.Value : stage.End) : stage.End))
                .ToImmutableList();

            var nonTerminatingSubset = nonTerminatingStage == null
                ? null
                : new NonTerminatingTimelineStage(
                    start > nonTerminatingStage.Start ? start : nonTerminatingStage.Start);

            return nonTerminatingSubset == null
                ? new Timeline(terminatingSubset)
                : new Timeline(terminatingSubset, nonTerminatingSubset);
        }
    }
}
