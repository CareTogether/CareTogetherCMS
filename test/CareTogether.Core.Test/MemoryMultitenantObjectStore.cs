using CareTogether.Resources.Storage;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    public sealed class MemoryMultitenantObjectStore<T> : IObjectStore<T>
    {
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId, string objectId), T> tenantObjects = new();


        public async Task<OneOf<Success, Error>> DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            tenantObjects.Remove((organizationId, locationId, objectId), out _);
            return new Success();
        }

        public async Task<OneOf<Success<T>, Error>> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            await Task.Yield();
            return tenantObjects.TryGetValue((organizationId, locationId, objectId), out var value)
                ? new Success<T>(value)
                : new Error();
        }

        public async Task<OneOf<Success, Error>> UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value)
        {
            await Task.Yield();
            tenantObjects[(organizationId, locationId, objectId)] = value;
            return new Success();
        }
    }
}
