using System.Collections.Immutable;

namespace Timelines;

public sealed record TerminatingTimelineStage(DateTime Start, DateTime End);
public sealed record NonTerminatingTimelineStage(DateTime Start);

public sealed record AbsoluteTimeSpan(DateTime Start, DateTime End)
{
    public TimeSpan Duration => End - Start;
}

/// <summary>
/// The <see cref="Timeline"/> class simplifies temporal calculations by
/// mapping high-level concepts like durations and intervals onto
/// potentially-discontinuous underlying time segments.
/// </summary>
public sealed class Timeline : IEquatable<Timeline?>
{
    private readonly ImmutableList<AbsoluteTimeSpan> stages;


    public DateTime Start => stages.First().Start;

    public DateTime End => stages.Last().End;

    public DateOnly StartDate => DateOnly.FromDateTime(Start);

    public DateOnly EndDate => DateOnly.FromDateTime(End);

    public Timeline(DateTime start, DateTime end)
        : this(ImmutableList.Create(new TerminatingTimelineStage(start, end)))
    { }

    public Timeline(ImmutableList<TerminatingTimelineStage> terminatingStages)
    {
        if (terminatingStages.Count == 0)
            throw new ArgumentException("At least one timeline stage is required.");

        if (terminatingStages.Any(stage => stage.End < stage.Start))
            throw new ArgumentException("All timeline stages must have start dates before their end dates.");

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

    public AbsoluteTimeSpan MapUnbounded(TimeSpan startDelay, TimeSpan duration)
    {
        var start = MapUnbounded(startDelay);
        var end = MapUnbounded(startDelay + duration);

        return new AbsoluteTimeSpan(start, end);
    }

    public DateTime? TryMapFrom(DateTime offset, TimeSpan duration)
    {
        try
        {
            var subsetFromOffset = Subset(offset, DateTime.MaxValue);
            var mappedDurationInSubset = subsetFromOffset.TryMap(duration);
            return mappedDurationInSubset;
        }
        catch
        {
            return null;
        }
    }

    public DateTime MapUnbounded(TimeSpan durationFromStart)
    {
        var result = TryMap(durationFromStart);

        if (result == null)
            return DateTime.MaxValue;

        return result.Value;
    }

    public DateTime? TryMap(TimeSpan durationFromStart)
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
            return null;

        return mappedStageStartDate +
            durationFromStart - mappedDurationPriorToCurrentStage;
    }

    public Timeline Subset(DateTime start, DateTime? end)
    {
        var subsetEnd = end.HasValue ? end.Value : DateTime.MaxValue;

        var subsetStages = stages
            .Where(stage => stage.Start <= subsetEnd && stage.End >= start)
            .Select(stage => new TerminatingTimelineStage(
                Start: start > stage.Start ? start : stage.Start,
                End: subsetEnd < stage.End ? subsetEnd : stage.End))
            .ToImmutableList();

        // To protect against invalid timelines when the subset is empty,
        // return a single-instant timeline starting at the requested start date.
        return subsetStages.Count == 0
            ? new Timeline(start, start)
            : new Timeline(subsetStages);
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
