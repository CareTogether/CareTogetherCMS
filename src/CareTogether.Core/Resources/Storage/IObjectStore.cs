using System;
using System.Threading.Tasks;

namespace CareTogether.Resources.Storage
{
    public interface IObjectStore<T>
    {
        Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value);

        Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId);

        Task DeleteAsync(Guid organizationId, Guid locationId, string objectId);
    }
}
