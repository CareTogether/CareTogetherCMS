using JsonPolymorph;
using System;

namespace CareTogether
{
    [JsonHierarchyBase]
    public abstract partial record DomainEvent(Guid UserId, DateTime TimestampUtc);
}
