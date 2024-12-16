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
        private readonly BlobServiceClient blobServiceClient;
        private readonly string fileCategory;
        private readonly ConcurrentDictionary<Guid, BlobContainerClient> organizationBlobContainerClients;

        public BlobFileStore(BlobServiceClient blobServiceClient, string fileCategory)
        {
            this.blobServiceClient = blobServiceClient;
            this.fileCategory = fileCategory;
            organizationBlobContainerClients = new(); //TODO: Share this across all services using the same blobServiceClient.
        }

        public Task<Uri> GetValetCreateUrlAsync(Guid organizationId, Guid locationId, Guid documentId) =>
            GetValetCreateUrlAsync(organizationId, locationId, $"{documentId:D}");

        public Task<Uri> GetValetCreateUrlAsync(Guid organizationId, Guid locationId, string documentSubpath)
        {
            var tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId.ToString());
            var objectBlob = tenantContainer.GetBlockBlobClient($"{locationId}/{fileCategory}/{documentSubpath}");
            var sasUri = objectBlob.GenerateSasUri(BlobSasPermissions.Create, DateTimeOffset.UtcNow.AddMinutes(15));
            return Task.FromResult(sasUri);
        }

        public Task<Uri> GetValetReadUrlAsync(Guid organizationId, Guid locationId, Guid documentId) =>
            GetValetReadUrlAsync(organizationId, locationId, $"{documentId:D}");

        public Task<Uri> GetValetReadUrlAsync(Guid organizationId, Guid locationId, string documentSubpath)
        {
            var tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId.ToString());
            var objectBlob = tenantContainer.GetBlockBlobClient($"{locationId}/{fileCategory}/{documentSubpath}");
            var sasUri = objectBlob.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddMinutes(15));
            return Task.FromResult(sasUri);
        }

        private async Task<BlobContainerClient> CreateContainerIfNotExists(Guid organizationId)
        {
            if (organizationBlobContainerClients.ContainsKey(organizationId))
            {
                return organizationBlobContainerClients[organizationId];
            }
            else
            {
                var blobClient = blobServiceClient.GetBlobContainerClient(organizationId.ToString());

                if (!await blobClient.ExistsAsync())
                {
                    await blobClient.CreateAsync();
                }

                organizationBlobContainerClients[organizationId] = blobClient;
                return blobClient;
            }
        }
    }
}
