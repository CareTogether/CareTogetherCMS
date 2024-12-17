using System.Collections.Immutable;

namespace Timelines
{
    public sealed record TerminatingTimelineStage(DateTime Start, DateTime End);

    public sealed record NonTerminatingTimelineStage(DateTime Start);

    public sealed record AbsoluteTimeSpan(DateTime Start, DateTime End)
    {
        public TimeSpan Duration => End - Start;
    }

    /// <summary>
    ///     The <see cref="Timeline" /> class simplifies temporal calculations by
    ///     mapping high-level concepts like durations and intervals onto
    ///     potentially-discontinuous underlying time segments.
    /// </summary>
    public sealed class Timeline : IEquatable<Timeline?>
    {
        readonly ImmutableList<AbsoluteTimeSpan> _Stages;

        public Timeline(DateTime start, DateTime end)
            : this(ImmutableList.Create(new TerminatingTimelineStage(start, end))) { }

        public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages)
        {
            if (terminatingStages.Count == 0)
            {
                throw new ArgumentException("At least one timeline stage is required.");
            }

            if (terminatingStages.Any(stage => stage.End < stage.Start))
            {
                throw new ArgumentException("All timeline stages must have start dates before their end dates.");
            }

            _Stages = terminatingStages.Select(stage => new AbsoluteTimeSpan(stage.Start, stage.End)).ToImmutableList();
        }

        public Timeline(
            ImmutableList<TerminatingTimelineStage> terminatingStages,
            NonTerminatingTimelineStage nonTerminatingStage
        )
            : this(
                terminatingStages
                    .Select(stage => new AbsoluteTimeSpan(stage.Start, stage.End))
                    .Append(new AbsoluteTimeSpan(nonTerminatingStage.Start, DateTime.MaxValue))
                    .ToImmutableList()
            ) { }

        Timeline(ImmutableList<AbsoluteTimeSpan> stages)
        {
            //TODO: Validate stage invariants (sequential start & end, sequential stages)

            _Stages = stages;
        }

        public DateTime Start => _Stages.First().Start;

        public DateTime End => _Stages.Last().End;

        public bool Equals(Timeline? other)
        {
            return other != null && _Stages.SequenceEqual(other._Stages);
        }

        public bool Contains(DateTime value)
        {
            return _Stages.Exists(stage => stage.Start <= value && stage.End >= value);
        }

        public AbsoluteTimeSpan MapUnbounded(TimeSpan startDelay, TimeSpan duration)
        {
            DateTime start = MapUnbounded(startDelay);
            DateTime end = MapUnbounded(startDelay + duration);

            return new AbsoluteTimeSpan(start, end);
        }

        public DateTime? TryMapFrom(DateTime offset, TimeSpan duration)
        {
            try
            {
                Timeline? subsetFromOffset = Subset(offset, DateTime.MaxValue);
                DateTime? mappedDurationInSubset = subsetFromOffset.TryMap(duration);
                return mappedDurationInSubset;
            }
            catch
            {
                return null;
            }
        }

        public DateTime MapUnbounded(TimeSpan durationFromStart)
        {
            DateTime? result = TryMap(durationFromStart);

            if (result == null)
            {
                return DateTime.MaxValue;
            }

            return result.Value;
        }

        public DateTime? TryMap(TimeSpan durationFromStart)
        {
            DateTime? mappedStageStartDate = null;
            TimeSpan mappedDurationPriorToCurrentStage = TimeSpan.Zero;

            foreach (AbsoluteTimeSpan? stage in _Stages)
            {
                if (stage.Duration + mappedDurationPriorToCurrentStage >= durationFromStart)
                {
                    mappedStageStartDate = stage.Start;
                    break;
                }

                mappedDurationPriorToCurrentStage += stage.Duration;
            }

            if (mappedStageStartDate == null)
            {
                return null;
            }

            return mappedStageStartDate + durationFromStart - mappedDurationPriorToCurrentStage;
        }

        public Timeline Subset(DateTime start, DateTime? end)
        {
            DateTime subsetEnd = end.HasValue ? end.Value : DateTime.MaxValue;

            ImmutableList<TerminatingTimelineStage>? subsetStages = _Stages
                .Where(stage => stage.Start <= subsetEnd && stage.End >= start)
                .Select(stage => new TerminatingTimelineStage(
                    start > stage.Start ? start : stage.Start,
                    subsetEnd < stage.End ? subsetEnd : stage.End
                ))
                .ToImmutableList();

            // To protect against invalid timelines when the subset is empty,
            // return a single-instant timeline starting at the requested start date.
            return subsetStages.Count == 0 ? new Timeline(start, start) : new Timeline(subsetStages);
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as Timeline);
        }

        public override int GetHashCode()
        {
            return _Stages.GetHashCode();
        }
    }
}
