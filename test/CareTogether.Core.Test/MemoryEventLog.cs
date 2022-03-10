using CareTogether.Utilities.EventLog;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    public sealed class MemoryEventLog<T> : IEventLog<T>
    {
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), List<T>> tenantLogs = new();


        public async Task AppendEventAsync(
            Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            await Task.Yield();
            var tenantLog = tenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            if (tenantLog.LongCount() + 1 != expectedSequenceNumber)
                throw new InvalidOperationException("Sequence number mismatch");

            tenantLog.Add(domainEvent);
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId, Guid locationId)
        {
            await Task.Yield();
            var tenantLog = tenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            foreach (var result in tenantLog
                .Select((value, index) => (DomainEvent: value, SequenceNumber: index + 1)))
                yield return result;
        }
    }
}
