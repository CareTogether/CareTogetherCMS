using CareTogether.Abstractions;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Utilities
{
    public sealed class MemoryMultitenantEventLog<T> : IMultitenantEventLog<T>
    {
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), List<T>> tenantLogs = new();


        public async Task<OneOf<Success, Error>> AppendEventAsync(
            Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            await Task.Yield();
            var tenantLog = tenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            if (tenantLog.LongCount() != expectedSequenceNumber)
                return new Error();

            tenantLog.Add(domainEvent);
            return new Success();
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId, Guid locationId)
        {
            await Task.Yield();
            var tenantLog = tenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            foreach (var result in tenantLog
                .Select((value, index) => (DomainEvent: value, SequenceNumber: index)))
                yield return result;
        }
    }
}
