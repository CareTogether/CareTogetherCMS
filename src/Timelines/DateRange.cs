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

    public int TotalDaysInclusive =>
        End.DayNumber - Start.DayNumber + 1;

    public DateRange TakeMaxDays(int length)
    {
        if (TotalDaysInclusive <= length)
            return this;

        return new DateRange(Start, Start.AddDays(length - 1));
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

public readonly struct DateRange<T> : IEquatable<DateRange<T>>
{
    public readonly DateOnly Start;
    public readonly DateOnly End;
    public readonly T Tag;


    public DateRange(DateOnly start, T tag) : this(start, DateOnly.MaxValue, tag)
    { }

    public DateRange(DateOnly start, DateOnly end, T tag)
    {
        if (start > end)
            throw new ArgumentException(
                "The start date must be on or before the end date.");

        Start = start;
        End = end;
        Tag = tag;
    }


    public bool Contains(DateOnly value) =>
        value >= Start && value <= End;


    public bool Equals(DateRange<T> other)
    {
        return Start == other.Start && End == other.End && (
            (Tag == null && other.Tag == null) ||
            (Tag != null && Tag.Equals(other.Tag)));
    }

    public override bool Equals([NotNullWhen(true)] object? obj)
    {
        if (obj is DateRange other)
            return Equals(other);

        return base.Equals(obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Start, End, Tag);
    }

    public override string ToString()
    {
        return $"{Tag}:{Start:yyyyMMdd}-{End:yyyyMMdd}";
    }
}
