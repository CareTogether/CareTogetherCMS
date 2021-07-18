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
        private LogType _logType;
        private BlobServiceClient _blobServiceClient;
        private ConcurrentDictionary<(Guid organizationId, Guid locationId), int> _tenantEventCounts;

        public AppendBlobMultitenantEventLog(BlobServiceClient blobServiceClient, LogType logType)
        {
            this._blobServiceClient = blobServiceClient;
            this._logType = logType;        
        }

        public async Task<OneOf<Success, Error>> AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            var tenantContainer = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

            var numberOfTenantEvents = _tenantEventCounts[(organizationId, locationId)];

            var currentBlobNum = (50000 / numberOfTenantEvents)+1;

            var tenantBlob = tenantContainer.GetAppendBlobClient($"{locationId}/{_logType.ConvertToString()}/{currentBlobNum.ToString("D5")}.ndjson");

            if(!tenantBlob.Exists())
            {
                await tenantBlob.CreateAsync();
                await tenantBlob.SetHttpHeadersAsync(new BlobHttpHeaders() { ContentType = "application/x-ndjson" });
            }

            var eventJson = JsonConvert.SerializeObject(domainEvent);

            var cleanEventJson = eventJson.Replace("\n", "").Replace("\r", "");

            var eventStream = new MemoryStream(Encoding.UTF8.GetBytes(cleanEventJson));

            var appendReturn = (BlobAppendInfo) await tenantBlob.AppendBlockAsync(eventStream);
            
            if(appendReturn.BlobCommittedBlockCount == expectedSequenceNumber)
            {
                return new Success();
            }
            else
            {
                return new Error();
            }
        }

        public async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId)
        {
            var tenantContainer = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

            var tenantBlobs = tenantContainer.GetBlobs(BlobTraits.None, BlobStates.None, $"{locationId}/{_logType.ConvertToString()}");

            foreach (BlobItem blob in tenantBlobs)
            {
                var appendBlob = tenantContainer.GetAppendBlobClient(blob.Name);
   
                var eventStream = await appendBlob.OpenReadAsync();

                string eventString = new StreamReader(eventStream).ReadToEnd();

                using (StringReader reader = new StringReader(eventString))
                {
                    string line;
                    long lineNumber = 0;

                    while ((line = reader.ReadLine()) != null)
                    {
                        lineNumber++;

                        T item = JsonConvert.DeserializeObject<T>(line);

                        yield return (item, lineNumber);
                    }

                    _tenantEventCounts.AddOrUpdate((organizationId, locationId), 0, (OldKey, OldValue) => OldValue + ((int)lineNumber));
                }
            }
        }
    }
}
