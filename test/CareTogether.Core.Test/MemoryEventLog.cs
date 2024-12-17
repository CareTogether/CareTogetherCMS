using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Core.Test
{
    public sealed class MemoryEventLog<T> : IEventLog<T>
    {
        readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), List<T>> _TenantLogs = new();

        public async Task AppendEventAsync(
            Guid organizationId,
            Guid locationId,
            T domainEvent,
            long expectedSequenceNumber
        )
        {
            await Task.Yield();
            List<T> tenantLog = _TenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            if (tenantLog.LongCount() + 1 != expectedSequenceNumber)
            {
                throw new InvalidOperationException("Sequence number mismatch");
            }

            tenantLog.Add(domainEvent);
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            await Task.Yield();
            List<T> tenantLog = _TenantLogs.GetOrAdd((organizationId, locationId), new List<T>());
            foreach (
                (T DomainEvent, int SequenceNumber) result in tenantLog.Select(
                    (value, index) => (DomainEvent: value, SequenceNumber: index + 1)
                )
            )
            {
                yield return result;
            }
        }
    }
}
