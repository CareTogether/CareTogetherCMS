using System;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Utilities
{
    public interface IMultitenantKeyValueStore<T>
    {
        Task<T> GetValueAsync(Guid organizationId, Guid locationId, Guid key);

        IQueryable<T> QueryValues(Guid organizationId, Guid locationId);

        Task UpsertValueAsync(Guid organizationId, Guid locationId, Guid key, T value);
    }
}
