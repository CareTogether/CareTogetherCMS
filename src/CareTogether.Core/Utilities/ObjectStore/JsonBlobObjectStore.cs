using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace CareTogether.Utilities.ObjectStore
{
    public class JsonBlobObjectStore<T> : IObjectStore<T>
    {
        readonly BlobServiceClient _BlobServiceClient;
        readonly TimeSpan _CacheExpiration;
        readonly IMemoryCache _MemoryCache;
        readonly string _ObjectType;
        readonly ConcurrentDictionary<Guid, BlobContainerClient> _OrganizationBlobContainerClients;

        public JsonBlobObjectStore(
            BlobServiceClient blobServiceClient,
            string objectType,
            IMemoryCache memoryCache,
            TimeSpan cacheExpiration
        )
        {
            _BlobServiceClient = blobServiceClient;
            _ObjectType = objectType;
            _MemoryCache = memoryCache;
            _CacheExpiration = cacheExpiration;
            _OrganizationBlobContainerClients = new ConcurrentDictionary<Guid, BlobContainerClient>(); //TODO: Share this across all services using the same blobServiceClient.
        }

        public async Task DeleteAsync(Guid organizationId, Guid locationId, string objectId)
        {
            _MemoryCache.Remove(CacheKey(organizationId, locationId, objectId));

            BlobContainerClient tenantContainer = await CreateContainerIfNotExists(organizationId);
            BlockBlobClient objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{_ObjectType}/{objectId}.json"
            );

            await objectBlob.DeleteIfExistsAsync();
        }

        public async Task<T> GetAsync(Guid organizationId, Guid locationId, string objectId)
        {
            if (
                _MemoryCache.TryGetValue(CacheKey(organizationId, locationId, objectId), out T? cachedValue)
                && cachedValue != null
            )
            {
                return cachedValue;
            }

            BlobContainerClient tenantContainer = await CreateContainerIfNotExists(organizationId);
            BlockBlobClient objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{_ObjectType}/{objectId}.json"
            );

            Response<BlobDownloadStreamingResult> objectStream = await objectBlob.DownloadStreamingAsync();
            string objectText = new StreamReader(objectStream.Value.Content).ReadToEnd();
            T? objectValue = JsonConvert.DeserializeObject<T>(objectText);

            if (objectValue == null)
            {
                throw new InvalidOperationException(
                    $"Unexpected null object deserialized in organization {organizationId}, location {locationId}, "
                        + $"object type {_ObjectType}, object ID '{objectId}', blob '{objectBlob.Name}'. "
                        + $"Expected type: {typeof(T).FullName}"
                );
            }

            _MemoryCache.Set(CacheKey(organizationId, locationId, objectId), objectValue, _CacheExpiration);

            return objectValue;
        }

        public async Task UpsertAsync(Guid organizationId, Guid locationId, string objectId, T value)
        {
            BlobContainerClient tenantContainer = await CreateContainerIfNotExists(organizationId);
            BlockBlobClient objectBlob = tenantContainer.GetBlockBlobClient(
                $"{locationId}/{_ObjectType}/{objectId}.json"
            );

            string objectText = JsonConvert.SerializeObject(value);
            MemoryStream objectStream = new(Encoding.UTF8.GetBytes(objectText));
            await objectBlob.UploadAsync(
                objectStream,
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = "application/json" } }
            );

            _MemoryCache.Set(CacheKey(organizationId, locationId, objectId), value, _CacheExpiration);
        }

        public async IAsyncEnumerable<string> ListAsync(Guid organizationId, Guid locationId)
        {
            BlobContainerClient tenantContainer = await CreateContainerIfNotExists(organizationId);

            await foreach (BlobItem blob in tenantContainer.GetBlobsAsync(prefix: $"{locationId}/{_ObjectType}/"))
            {
                string objectId = blob.Name.Substring(blob.Name.LastIndexOf('/') + 1).Replace(".json", "");
                yield return objectId;
            }
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

        string CacheKey(Guid organizationId, Guid locationId, string objectId)
        {
            return $"{_ObjectType}_{organizationId}_{locationId}_{objectId}";
        }
    }
}
