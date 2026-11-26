using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace CareTogether.Utilities.ObjectStore
{
    public class JsonBlobObjectStore<T> : IObjectStore<T>
    {
        private readonly BlobServiceClient blobServiceClient;
        private readonly string objectType;
        private readonly IMemoryCache memoryCache;
        private readonly TimeSpan cacheExpiration;
        private readonly object cacheLock = new();
        private long cacheGeneration;
        private readonly ConcurrentDictionary<
            Guid,
            BlobContainerClient
        > organizationBlobContainerClients;

        public JsonBlobObjectStore(
            BlobServiceClient blobServiceClient,
            string objectType,
            IMemoryCache memoryCache,
            TimeSpan cacheExpiration
        )
        {
            this.blobServiceClient = blobServiceClient;
            this.objectType = objectType;
            this.memoryCache = memoryCache;
            this.cacheExpiration = cacheExpiration;
            organizationBlobContainerClients = new(); //TODO: Share this across all services using the same blobServiceClient.
        }

        public async Task DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{objectType}/{objectId}.json"
            );

            try
            {
                await objectBlob.DeleteIfExistsAsync();
            }
            finally
            {
                InvalidateCache(CacheKey(organizationId, locationId, objectId));
            }
        }

        public async Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            var key = CacheKey(organizationId, locationId, objectId);
            long generation;
            lock (cacheLock)
            {
                if (memoryCache.TryGetValue<T>(key, out var cached) && cached is not null)
                    return cached;
                generation = cacheGeneration;
            }

            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{objectType}/{objectId}.json"
            );

            var response = (await objectBlob.DownloadStreamingAsync()).Value;
            using var reader = new StreamReader(response.Content);
            var objectValue = JsonConvert.DeserializeObject<T>(await reader.ReadToEndAsync());

            if (objectValue == null)
                throw new InvalidOperationException(
                    $"Unexpected null object deserialized in organization {organizationId}, location {locationId}, "
                        + $"object type {objectType}, object ID '{objectId}', blob '{objectBlob.Name}'. "
                        + $"Expected type: {typeof(T).FullName}"
                );

            lock (cacheLock)
            {
                if (generation == cacheGeneration)
                    memoryCache.Set(key, objectValue, cacheExpiration);
            }
            return objectValue;
        }

        public async Task UpsertAsync(
            Guid organizationId,
            Guid locationId,
            string objectId,
            T value
        )
        {
            var tenantContainer = await CreateContainerIfNotExists(organizationId);
            var objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{objectType}/{objectId}.json"
            );

            var objectText = JsonConvert.SerializeObject(value);
            using var objectStream = new MemoryStream(Encoding.UTF8.GetBytes(objectText));
            try
            {
                await objectBlob.UploadAsync(
                    objectStream,
                    new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = "application/json" },
                    }
                );
            }
            finally
            {
                InvalidateCache(CacheKey(organizationId, locationId, objectId));
            }
        }

        private void InvalidateCache(string key)
        {
            lock (cacheLock)
            {
                cacheGeneration++;
                memoryCache.Remove(key);
            }
        }

        public async IAsyncEnumerable<string> ListAsync(Guid organizationId, Guid locationId)
        {
            var tenantContainer = await CreateContainerIfNotExists(organizationId);

            await foreach (
                var blob in tenantContainer.GetBlobsAsync(
                    BlobTraits.None,
                    BlobStates.None,
                    $"{locationId}/{objectType}/",
                    default
                )
            )
            {
                var objectId = blob
                    .Name.Substring(blob.Name.LastIndexOf('/') + 1)
                    .Replace(".json", "");
                yield return objectId;
            }
        }

        private async Task<BlobContainerClient> CreateContainerIfNotExists(Guid organizationId)
        {
            if (organizationBlobContainerClients.ContainsKey(organizationId))
            {
                return organizationBlobContainerClients[organizationId];
            }
            else
            {
                var blobClient = blobServiceClient.GetBlobContainerClient(
                    organizationId.ToString()
                );

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
