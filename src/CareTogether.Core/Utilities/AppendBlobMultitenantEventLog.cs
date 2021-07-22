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


namespace CareTogether.Utilities
{
    public class AppendBlobMultitenantEventLog<T>
    {
        private readonly LogType _logType;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), int> _tenantEventCounts;

        public AppendBlobMultitenantEventLog(BlobServiceClient blobServiceClient, LogType logType)
        {
            this._blobServiceClient = blobServiceClient;
            this._logType = logType;
            _tenantEventCounts = new ConcurrentDictionary<(Guid organizationId, Guid locationId), int>();
        }

        public async Task<OneOf<Success, Error>> AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            var tenantContainer = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

            var numberOfTenantEvents = _tenantEventCounts.GetOrAdd((organizationId, locationId), 0);

            var currentBlobNumber = numberOfTenantEvents == 0 ? 0 : (50000 / numberOfTenantEvents)+1;

            var logSegmentBlob = tenantContainer.GetAppendBlobClient($"{locationId}/{_logType.ToString()}/{currentBlobNumber.ToString("D5")}.ndjson");

            await logSegmentBlob.CreateIfNotExistsAsync();
            await logSegmentBlob.SetHttpHeadersAsync(new BlobHttpHeaders() { ContentType = "application/x-ndjson" });

            // excplicitly setting the StringEscapeHandling property so that it's immediately obvious how escaping is being handled, and so that
            // it's easy to change the behavior if that becomes necessary in the future
            var eventJson = JsonConvert.SerializeObject(domainEvent, Formatting.None, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.Default });

            var eventStream = new MemoryStream(Encoding.UTF8.GetBytes(eventJson));

            // this ensures that we only append exactly where we expect to
            var appendBlobConditions = new AppendBlobRequestConditions()
            {
                IfAppendPositionEqual = expectedSequenceNumber
            };

            try
            {
                await logSegmentBlob.AppendBlockAsync(eventStream, conditions: appendBlobConditions);
                return new Success();
            }
            catch (Exception e)
            {
                Console.WriteLine($"Could not append to block {expectedSequenceNumber} in {locationId}/{_logType.ToString()}/{currentBlobNumber.ToString("D5")}.ndjson" +
                    $" under tenant {organizationId} because the append position did not match the expected position.");
                return new Error();
            }
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId)
        {
            var tenantContainer = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

            long eventSequenceNumber = 0;

            await foreach (BlobItem blob in tenantContainer.GetBlobsAsync(BlobTraits.None, BlobStates.None, $"{locationId}/{_logType.ToString()}"))
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

            _tenantEventCounts.TryAdd((organizationId, locationId), (int)eventSequenceNumber);
        }
    }
}
