using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Utilities.ObjectStore
{
    public class JsonBlobObjectStore<T> : IObjectStore<T>
    {
        private readonly BlobServiceClient blobServiceClient;
        private readonly string objectType;
        private readonly IMemoryCache memoryCache;
        private readonly TimeSpan cacheExpiration;
        private readonly ConcurrentDictionary<Guid, BlobContainerClient> organizationBlobContainerClients;

        public JsonBlobObjectStore(BlobServiceClient blobServiceClient, string objectType,
            IMemoryCache memoryCache, TimeSpan cacheExpiration)
        {
            this.blobServiceClient = blobServiceClient;
            this.objectType = objectType;
            this.memoryCache = memoryCache;
            this.cacheExpiration = cacheExpiration;
            organizationBlobContainerClients = new(); //TODO: Share this across all services using the same blobServiceClient.
        }


        public async Task DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            memoryCache.Remove(CacheKey(organizationId, locationId, objectId));

            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient($"{locationId}/{objectType}/{objectId}.json");

            await objectBlob.DeleteIfExistsAsync();
        }

        public async Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            if (memoryCache.TryGetValue<T>(CacheKey(organizationId, locationId, objectId), out var cachedValue) &&
                cachedValue != null)
                return cachedValue;
            
            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient($"{locationId}/{objectType}/{objectId}.json");

            var objectStream = await objectBlob.DownloadStreamingAsync();
            var objectText = new StreamReader(objectStream.Value.Content).ReadToEnd();
            var objectValue = JsonConvert.DeserializeObject<T>(objectText);

            if (objectValue == null)
                throw new InvalidOperationException(
                    $"Unexpected null object deserialized in organization {organizationId}, location {locationId}, " +
                    $"object type {objectType}, object ID '{objectId}', blob '{objectBlob.Name}'. " +
                    $"Expected type: {typeof(T).FullName}");

            memoryCache.Set(CacheKey(organizationId, locationId, objectId), objectValue, cacheExpiration);

            return objectValue;
        }

        public async Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value)
        {
            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient($"{locationId}/{objectType}/{objectId}.json");

            var objectText = JsonConvert.SerializeObject(value);
            var objectStream = new MemoryStream(Encoding.UTF8.GetBytes(objectText));
            await objectBlob.UploadAsync(objectStream,
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = "application/json" } });

            memoryCache.Set(CacheKey(organizationId, locationId, objectId), value, cacheExpiration);
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

        private string CacheKey(Guid organizationId, Guid locationId, string objectId) =>
            $"{objectType}_{organizationId}_{locationId}_{objectId}";
    }
}
