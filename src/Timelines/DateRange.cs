using System.Diagnostics.CodeAnalysis;

namespace Timelines;

public readonly struct DateRange : IEquatable<DateRange>
{
    public readonly DateOnly Start;
    public readonly DateOnly End;


    public DateRange(DateOnly start) : this(start, DateOnly.MaxValue)
    { }

    public DateRange(DateOnly start, DateOnly end)
    {
        if (start > end)
            throw new ArgumentException(
                "The start date must be on or before the end date.");

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
