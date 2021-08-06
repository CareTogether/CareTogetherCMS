using OneOf;
using OneOf.Types;
using System;
using System.Threading.Tasks;

namespace CareTogether.Resources.Storage
{
    public interface IObjectStore<T>
    {
        Task<OneOf<Success, Error>> UpsertAsync(Guid organizationId, Guid locationId, Guid objectId, T value);

        Task<OneOf<Success<T>, Error>> GetAsync(Guid organizationId, Guid locationId, Guid objectId);

        Task<OneOf<Success, Error>> DeleteAsync(Guid organizationId, Guid locationId, Guid objectId);
    }
}
