using System;
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

        public AppendBlobMultitenantEventLog(BlobServiceClient blobServiceClient, LogType logType)
        {
            this._blobServiceClient = blobServiceClient;
            this._logType = logType;        
        }

        public async Task<OneOf<Success, Error>> AppendEventAsync(Guid organizationId, Guid locationId, T domainEvent, long expectedSequenceNumber)
        {
            var tenantContainer = _blobServiceClient.GetBlobContainerClient(organizationId.ToString());

            var tenantBlob = tenantContainer.GetAppendBlobClient($"{locationId}/{_logType.ConvertToString()}/00001.ndjson");

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

        public IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(Guid organizationId, Guid locationId)
        {
            return null;
        }
    }
}
