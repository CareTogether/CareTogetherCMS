using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using Azure.Storage.Sas;

namespace CareTogether.Utilities.FileStore
{
    public class BlobFileStore : IFileStore
    {
        readonly BlobServiceClient _BlobServiceClient;
        readonly string _FileCategory;
        readonly ConcurrentDictionary<Guid, BlobContainerClient> _OrganizationBlobContainerClients;

        public BlobFileStore(BlobServiceClient blobServiceClient, string fileCategory)
        {
            _BlobServiceClient = blobServiceClient;
            _FileCategory = fileCategory;
            _OrganizationBlobContainerClients = new ConcurrentDictionary<Guid, BlobContainerClient>(); //TODO: Share this across all services using the same blobServiceClient.
        }

        public Task<Uri> GetValetCreateUrlAsync(Guid organizationId, Guid locationId, Guid documentId)
        {
            return GetValetCreateUrlAsync(organizationId, locationId, $"{documentId:D}");
        }

        public Task<Uri> GetValetCreateUrlAsync(Guid organizationId, Guid locationId, string documentSubpath)
        {
            BlobContainerClient tenantContainer = _BlobServiceClient.GetBlobContainerClient(organizationId.ToString());
            BlockBlobClient objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{_FileCategory}/{documentSubpath}"
            );
            Uri sasUri = objectBlob.GenerateSasUri(BlobSasPermissions.Create, DateTimeOffset.UtcNow.AddMinutes(15));
            return Task.FromResult(sasUri);
        }

        public Task<Uri> GetValetReadUrlAsync(Guid organizationId, Guid locationId, Guid documentId)
        {
            return GetValetReadUrlAsync(organizationId, locationId, $"{documentId:D}");
        }

        public Task<Uri> GetValetReadUrlAsync(Guid organizationId, Guid locationId, string documentSubpath)
        {
            BlobContainerClient tenantContainer = _BlobServiceClient.GetBlobContainerClient(organizationId.ToString());
            BlockBlobClient objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{_FileCategory}/{documentSubpath}"
            );
            Uri sasUri = objectBlob.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddMinutes(15));
            return Task.FromResult(sasUri);
        }

        async Task<BlobContainerClient> CreateContainerIfNotExists(Guid organizationId)
        {
            if (_OrganizationBlobContainerClients.ContainsKey(organizationId))
            {
                return _OrganizationBlobContainerClients[organizationId];
            }

            BlobContainerClient blobClient = _BlobServiceClient.GetBlobContainerClient(organizationId.ToString());

            if (!await blobClient.ExistsAsync())
            {
                await blobClient.CreateAsync();
            }

            _OrganizationBlobContainerClients[organizationId] = blobClient;
            return blobClient;
        }
    }
}
