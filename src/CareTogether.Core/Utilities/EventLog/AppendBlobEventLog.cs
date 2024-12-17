using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Newtonsoft.Json;

namespace CareTogether.Utilities.EventLog
{
    public class AppendBlobEventLog<T> : IEventLog<T>
    {
        readonly BlobServiceClient _BlobServiceClient;
        readonly string _LogType;
        readonly ConcurrentDictionary<Guid, BlobContainerClient> _OrganizationBlobContainerClients;

        public AppendBlobEventLog(BlobServiceClient blobServiceClient, string logType)
        {
            _BlobServiceClient = blobServiceClient;
            _LogType = logType;

            _OrganizationBlobContainerClients = new ConcurrentDictionary<Guid, BlobContainerClient>();
        }

        public async Task AppendEventAsync(
            Guid organizationId,
            Guid locationId,
            T domainEvent,
            long expectedSequenceNumber
        )
        {
            BlobContainerClient tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);

            long currentBlobNumber = getBlobNumber(expectedSequenceNumber);

            AppendBlobClient logSegmentBlob = tenantContainer.GetAppendBlobClient(
                $"{locationId}/{_LogType}/{currentBlobNumber:D5}.ndjson"
            );

            if (!await logSegmentBlob.ExistsAsync())
            {
                await logSegmentBlob.CreateAsync(
                    new AppendBlobCreateOptions
                    {
                        HttpHeaders = new BlobHttpHeaders { ContentType = "application/x-ndjson" },
                    }
                );
            }

            // Explicitly setting the StringEscapeHandling property so that it's immediately obvious how escaping is being handled,
            // and so that it's easy to change the behavior if that becomes necessary in the future.

            string eventJson =
                JsonConvert.SerializeObject(
                    domainEvent,
                    Formatting.None,
                    new JsonSerializerSettings { StringEscapeHandling = StringEscapeHandling.Default }
                ) + Environment.NewLine;

            MemoryStream eventStream = new(Encoding.UTF8.GetBytes(eventJson));

            try
            {
                Response<BlobAppendInfo> appendResult = await logSegmentBlob.AppendBlockAsync(eventStream);
            }
            catch (Exception e)
            {
                Debug.WriteLine(
                    $"There was an issue appending to block {expectedSequenceNumber} in {locationId}/{_LogType}/{currentBlobNumber:D5}.ndjson"
                        + $" under tenant {organizationId}: "
                        + e.Message
                );
                throw;
            }
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            BlobContainerClient tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);

            long eventSequenceNumber = 0;

            await foreach (
                BlobItem blob in tenantContainer.GetBlobsAsync(
                    BlobTraits.None,
                    BlobStates.None,
                    $"{locationId}/{_LogType}"
                )
            )
            {
                // Only process correctly named files. This is a reliability measure to protect against
                // files that might be uploaded to the wrong directory accidentally by another process.
                if (!blob.Name.EndsWith(".ndjson"))
                {
                    continue;
                }

                AppendBlobClient appendBlob = tenantContainer.GetAppendBlobClient(blob.Name);

                Stream eventStream = await appendBlob.OpenReadAsync();

                string eventString = new StreamReader(eventStream).ReadToEnd();

                using (StringReader reader = new(eventString))
                {
                    string? line;

                    while ((line = reader.ReadLine()) != null)
                    {
                        eventSequenceNumber++;

                        T? item = JsonConvert.DeserializeObject<T>(line);

                        yield return item == null
                            ? throw new InvalidOperationException(
                                $"Unexpected null object deserialized in organization {organizationId}, location {locationId}, "
                                    + $"log type {_LogType}, blob '{blob.Name}', event sequence # {eventSequenceNumber}. "
                                    + $"Expected type: {typeof(T).FullName}"
                            )
                            : (item, eventSequenceNumber);
                    }
                }
            }
        }

        public long getBlobNumber(long sequenceNumber)
        {
            return (sequenceNumber / 50001) + 1;
        }

        public long getBlockNumber(long sequenceNumber)
        {
            long result = sequenceNumber % 50000L;

            if (result == 0)
            {
                return 50000;
            }

            return result;
        }

        async Task<BlobContainerClient> CreateContainerIfNotExistsAsync(Guid organizationId)
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
