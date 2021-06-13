using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Abstractions
{
    public interface IMultitenantEventLog<T>
    {
        IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId);

        Task<OneOf<Success, Error>> AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber);
    }
}
