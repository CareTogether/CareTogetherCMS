using System;
using System.Threading.Tasks;

namespace CareTogether.Abstractions
{
    public interface IObjectStore<T>
    {
        Task UpsertAsync(Guid organizationId, Guid locationId, Guid objectId, T value);

        Task<T> GetAsync(Guid organizationId, Guid locationId, Guid objectId);

        Task DeleteAsync(Guid organizationId, Guid locatioNId, Guid objectId);
    }
}
