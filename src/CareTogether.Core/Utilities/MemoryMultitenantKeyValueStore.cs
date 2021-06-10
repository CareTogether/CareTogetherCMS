using CareTogether.Abstractions;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Utilities
{
    public sealed class MemoryMultitenantKeyValueStore<T> : IMultitenantKeyValueStore<T>
    {
        private readonly Dictionary<(Guid organizationId, Guid locationId, Guid key), T> values;


        public MemoryMultitenantKeyValueStore(
            IDictionary<(Guid organizationId, Guid locationId, Guid key), T> initialValues = null)
        {
            values = new Dictionary<(Guid organizationId, Guid locationId, Guid key), T>(initialValues);
        }


        public Task<OneOf<T, NotFound>> GetValueAsync(Guid organizationId, Guid locationId, Guid key) =>
            Task.FromResult<OneOf<T, NotFound>>(
                values.TryGetValue((organizationId, locationId, key), out var value)
                ? value
                : new NotFound());

        public IQueryable<T> QueryValues(Guid organizationId, Guid locationId) =>
            values.Where(kvp => kvp.Key.organizationId == organizationId && kvp.Key.locationId == locationId)
                .Select(kvp => kvp.Value)
                .ToList().AsQueryable();

        public Task UpsertValueAsync(Guid organizationId, Guid locationId, Guid key, T value)
        {
            values[(organizationId, locationId, key)] = value;
            return Task.CompletedTask;
        }
    }
}
