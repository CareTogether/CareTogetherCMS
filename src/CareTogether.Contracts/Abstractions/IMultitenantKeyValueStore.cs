using OneOf;
using OneOf.Types;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Abstractions
{
    public interface IMultitenantKeyValueStore<T>
    {
        Task<OneOf<T, NotFound>> GetValueAsync(Guid organizationId, Guid locationId, Guid key);

        IQueryable<T> QueryValues(Guid organizationId, Guid locationId);

        Task UpsertValueAsync(Guid organizationId, Guid locationId, Guid key, T value);
    }
}
