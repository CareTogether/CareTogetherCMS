using CareTogether.Resources.Storage;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    public sealed class MemoryMultitenantObjectStore<T> : IObjectStore<T>
    {
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId, string objectId), T> tenantObjects = new();


        public async Task DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            tenantObjects.Remove((organizationId, locationId, objectId), out _);
        }

        public async Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            return tenantObjects.TryGetValue((organizationId, locationId, objectId), out var value)
                ? value
                : throw new KeyNotFoundException();
        }

        public async Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value)
        {
            await Task.Yield();
            tenantObjects[(organizationId, locationId, objectId)] = value;
        }
    }
}
