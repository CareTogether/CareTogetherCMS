using System;
using System.Collections.Immutable;

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
    }
}
