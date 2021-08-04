using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Newtonsoft.Json;
using OneOf;
using OneOf.Types;

namespace CareTogether.Resources.Storage
{
    public class AppendBlobMultitenantEventLog<T> : IMultitenantEventLog<T>
    {
        private readonly LogType _logType;
        private readonly BlobServiceClient _blobServiceClient;
        private ConcurrentDictionary<Guid, BlobContainerClient> organizationBlobContainerClients;

        public AppendBlobMultitenantEventLog(BlobServiceClient blobServiceClient, LogType logType)
        {
            this._blobServiceClient = blobServiceClient;
            this._logType = logType;
            organizationBlobContainerClients = new();
        }

        public async Task<OneOf<Success, Error>> AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            var tenantContainer = await createContainerIfNotExists(organizationId);

            var currentBlobNumber = getBlobNumber(expectedSequenceNumber);

            var logSegmentBlob = tenantContainer.GetAppendBlobClient($"{locationId}/{_logType}/{currentBlobNumber:D5}.ndjson");

            if(!await logSegmentBlob.ExistsAsync())
            {
                await logSegmentBlob.CreateAsync();
                await logSegmentBlob.SetHttpHeadersAsync(new BlobHttpHeaders() { ContentType = "application/x-ndjson" });
            }
            
            // excplicitly setting the StringEscapeHandling property so that it's immediately obvious how escaping is being handled, and so that
            // it's easy to change the behavior if that becomes necessary in the future
            var eventJson = JsonConvert.SerializeObject(domainEvent, Formatting.None, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.Default }) + Environment.NewLine;

            var eventStream = new MemoryStream(Encoding.UTF8.GetBytes(eventJson));

            try
            {
                var appendResult = await logSegmentBlob.AppendBlockAsync(eventStream);

                if(appendResult.Value.BlobCommittedBlockCount == getBlockNumber(expectedSequenceNumber))
                {
                    return new Success();
                } else
                {
                    throw new Exception($"The append block number {appendResult.Value.BlobCommittedBlockCount} did not match the expected block number {expectedSequenceNumber}");
                }
            }
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine($"There was an issue appending to block {expectedSequenceNumber} in {locationId}/{_logType}/{currentBlobNumber:D5}.ndjson" +
                    $" under tenant {organizationId}: "+e.Message);
                return new Error();
            }
        }

        public long getBlobNumber(long sequenceNumber)
        {
            return (sequenceNumber / 50001) + 1;
        }

        public long getBlockNumber(long sequenceNumber)
        {
            var result = sequenceNumber % 50000L;

            if(result == 0)
            {
                return 50000;
            }
            else
            {
                return result;
            }
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId)
        {
            var tenantContainer = await createContainerIfNotExists(organizationId);

            long eventSequenceNumber = 0;

            await foreach (BlobItem blob in tenantContainer.GetBlobsAsync(BlobTraits.None, BlobStates.None, $"{locationId}/{_logType}"))
            {
                var appendBlob = tenantContainer.GetAppendBlobClient(blob.Name);
   
                var eventStream = await appendBlob.OpenReadAsync();

                string eventString = new StreamReader(eventStream).ReadToEnd();

                using (StringReader reader = new StringReader(eventString))
                {
                    string line;

                    while ((line = reader.ReadLine()) != null)
                    {
                        eventSequenceNumber++;

                        T item = JsonConvert.DeserializeObject<T>(line);

                        yield return (item, eventSequenceNumber);
                    }
                }
            }
        }

        private async Task<BlobContainerClient> createContainerIfNotExists(Guid organizationId)
        {
            if (organizationBlobContainerClients.ContainsKey(organizationId))
            {
                return organizationBlobContainerClients[organizationId];
            } else
            {
                var blobClient = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

                if(!await blobClient.ExistsAsync())
                {
                    await blobClient.CreateAsync();
                }

                organizationBlobContainerClients[organizationId] = blobClient;
                return blobClient;
            }
        }


    }
}
