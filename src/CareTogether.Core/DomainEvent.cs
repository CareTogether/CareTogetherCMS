using System;
using JsonPolymorph;

namespace CareTogether
{
    [JsonHierarchyBase]
    public abstract partial record DomainEvent(Guid UserId, DateTime TimestampUtc);
}
