using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareTogether.Utilities.ObjectStore
{
    public interface IObjectStore<T>
    {
        Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value);

        Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId);

        Task DeleteAsync(Guid organizationId, Guid locationId, string objectId);

        IAsyncEnumerable<string> ListAsync(Guid organizationId, Guid locationId);
    }
}
