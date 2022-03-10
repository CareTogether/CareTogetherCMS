using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Utilities.EventLog
{
    public interface IMultitenantEventLog<T>
    {
        IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId);

        Task AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber);
    }
}
