using System;
using CareTogether.Resources.Referrals;

public record ChildLocation(DateOnly Date, ChildLocationPlan Plan) : IComparable<ChildLocation>
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
