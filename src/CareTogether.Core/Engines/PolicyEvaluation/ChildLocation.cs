using System;

namespace CareTogether.Engines.PolicyEvaluation;

public sealed record ChildLocation(
    DateOnly Date,
    bool Paused // means "from now on, we stop checking for completion until resuming"
)
    : IComparable<ChildLocation>
{
    public int CompareTo(ChildLocation? other)
    {
        return other == null
            ? 1
            : DateTime.Compare(
                new DateTime(Date, new TimeOnly()),
                new DateTime(other.Date, new TimeOnly())
            );
    }
}
