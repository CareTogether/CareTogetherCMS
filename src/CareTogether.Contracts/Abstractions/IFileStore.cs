using System;
using System.Threading.Tasks;

namespace CareTogether.Abstractions
{
    public interface IFileStore
    {
        Task<Uri> GetValetReadUrlAsync(Guid organizationId, Guid locationId, Guid documentId);

        Task<Uri> GetValetCreateUrlAsync(Guid organizationId, Guid locationId, Guid documentId);
    }
}
