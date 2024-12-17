using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Core.Test
{
    public sealed class MemoryObjectStore<T> : IObjectStore<T>
    {
        readonly ConcurrentDictionary<(Guid organizationId, Guid locationId, string objectId), T> _TenantObjects =
            new();

        public async Task DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            _TenantObjects.Remove((organizationId, locationId, objectId), out _);
        }

        public async Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            return _TenantObjects.TryGetValue((organizationId, locationId, objectId), out T? value)
                ? value
                : throw new KeyNotFoundException();
        }

        public async IAsyncEnumerable<string> ListAsync(Guid organizationId, Guid locationId)
        {
            await Task.Yield();
            foreach (string? objectId in _TenantObjects.Keys.Select(key => key.objectId))
            {
                yield return objectId;
            }
        }

        public async Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value)
        {
            await Task.Yield();
            _TenantObjects[(organizationId, locationId, objectId)] = value;
        }
    }
}
