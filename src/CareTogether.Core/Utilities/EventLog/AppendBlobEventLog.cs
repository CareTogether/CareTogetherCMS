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

namespace CareTogether.Utilities.EventLog
{
    public class AppendBlobEventLog<T> : IEventLog<T>
    {
        private readonly string logType;
        private readonly BlobServiceClient blobServiceClient;
        private readonly ConcurrentDictionary<Guid, BlobContainerClient> organizationBlobContainerClients;

        public AppendBlobEventLog(BlobServiceClient blobServiceClient, string logType)
        {
            this.blobServiceClient = blobServiceClient;
            this.logType = logType;

            organizationBlobContainerClients = new();
        }

        public async Task AppendEventAsync(
            Guid organizationId,
            Guid locationId,
            T domainEvent,
            long expectedSequenceNumber
        )
        {
            var tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);

            var currentBlobNumber = getBlobNumber(expectedSequenceNumber);

            var logSegmentBlob = tenantContainer.GetAppendBlobClient(
                $"{locationId}/{logType}/{currentBlobNumber:D5}.ndjson"
            );

            if (!await logSegmentBlob.ExistsAsync())
                await logSegmentBlob.CreateAsync(
                    new AppendBlobCreateOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = "application/x-ndjson" },
                    }
                );

            // Explicitly setting the StringEscapeHandling property so that it's immediately obvious how escaping is being handled,
            // and so that it's easy to change the behavior if that becomes necessary in the future.
            var eventJson =
                JsonConvert.SerializeObject(
                    domainEvent,
                    Formatting.None,
                    new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.Default }
                ) + Environment.NewLine;

            var eventStream = new MemoryStream(Encoding.UTF8.GetBytes(eventJson));

            try
            {
                var appendResult = await logSegmentBlob.AppendBlockAsync(eventStream);
            }
            catch (Exception e)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"There was an issue appending to block {expectedSequenceNumber} in {locationId}/{logType}/{currentBlobNumber:D5}.ndjson"
                        + $" under tenant {organizationId}: "
                        + e.Message
                );
                throw;
            }
        }

        public long getBlobNumber(long sequenceNumber)
        {
            return (sequenceNumber / 50001) + 1;
        }

        public long getBlockNumber(long sequenceNumber)
        {
            var result = sequenceNumber % 50000L;

            if (result == 0)
                return 50000;
            else
                return result;
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            var tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);

            long eventSequenceNumber = 0;

            await foreach (
                var blob in tenantContainer.GetBlobsAsync(BlobTraits.None, BlobStates.None, $"{locationId}/{logType}")
            )
            {
                // Only process correctly named files. This is a reliability measure to protect against
                // files that might be uploaded to the wrong directory accidentally by another process.
                if (!blob.Name.EndsWith(".ndjson"))
                    continue;

                var appendBlob = tenantContainer.GetAppendBlobClient(blob.Name);

                var eventStream = await appendBlob.OpenReadAsync();

                var eventString = new StreamReader(eventStream).ReadToEnd();

                using (var reader = new StringReader(eventString))
                {
                    string? line;

                    while ((line = reader.ReadLine()) != null)
                    {
                        eventSequenceNumber++;

                        var item = JsonConvert.DeserializeObject<T>(line);

                        yield return item == null
                            ? throw new InvalidOperationException(
                                $"Unexpected null object deserialized in organization {organizationId}, location {locationId}, "
                                    + $"log type {logType}, blob '{blob.Name}', event sequence # {eventSequenceNumber}. "
                                    + $"Expected type: {typeof(T).FullName}"
                            )
                            : (item, eventSequenceNumber);
                    }
                }
            }
        }

        private async Task<BlobContainerClient> CreateContainerIfNotExistsAsync(Guid organizationId)
        {
            if (organizationBlobContainerClients.ContainsKey(organizationId))
                return organizationBlobContainerClients[organizationId];

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
