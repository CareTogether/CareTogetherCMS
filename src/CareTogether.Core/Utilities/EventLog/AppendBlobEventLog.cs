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
using Newtonsoft.Json;

namespace CareTogether.Utilities.EventLog
{
    internal sealed record EventLogPosition(
        long EventCount,
        string? Segment,
        ETag ETag,
        long Length
    );

    public class AppendBlobEventLog<T> : IEventLog<T>
    {
        private readonly string logType;
        private readonly BlobServiceClient blobServiceClient;
        private readonly ConcurrentDictionary<
            Guid,
            BlobContainerClient
        > organizationBlobContainerClients;

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
        ) =>
            await AppendBlockAsync(organizationId, locationId, domainEvent, expectedSequenceNumber);

        internal async Task<EventLogPosition?> AppendEventAsync(
            Guid organizationId,
            Guid locationId,
            T domainEvent,
            long expectedSequenceNumber,
            EventLogPosition? known
        )
        {
            var (segment, append, length) = await AppendBlockAsync(
                organizationId,
                locationId,
                domainEvent,
                expectedSequenceNumber
            );
            if (known is null || !long.TryParse(append.BlobAppendOffset, out var offset))
                return null;

            var continuous =
                segment == known.Segment
                    ? offset == known.Length
                    : offset == 0
                        && (
                            known.Segment is null
                            || SameETag(
                                await SegmentETagAsync(organizationId, known.Segment),
                                known.ETag
                            )
                        );
            return continuous
                ? new(known.EventCount + 1, segment, append.ETag, offset + length)
                : null;
        }

        internal async Task<bool> IsCurrentAsync(
            Guid organizationId,
            Guid locationId,
            EventLogPosition position
        )
        {
            try
            {
                var tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);
                BlobItem? last = null;
                await foreach (
                    var blob in tenantContainer.GetBlobsAsync(
                        BlobTraits.None,
                        BlobStates.None,
                        $"{locationId}/{logType}",
                        default
                    )
                )
                    if (blob.Name.EndsWith(".ndjson"))
                        last = blob;

                return last is null
                    ? position.Segment is null
                    : last.Name == position.Segment
                        && last.Properties.ContentLength == position.Length
                        && SameETag(last.Properties.ETag, position.ETag);
            }
            catch (RequestFailedException)
            {
                return false;
            }
        }

        private static bool SameETag(ETag? left, ETag right) =>
            left is { } value && value.ToString("H") == right.ToString("H");

        private async Task<ETag?> SegmentETagAsync(Guid organizationId, string segment)
        {
            try
            {
                var tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);
                return (await tenantContainer.GetAppendBlobClient(segment).GetPropertiesAsync())
                    .Value
                    .ETag;
            }
            catch (RequestFailedException)
            {
                return null;
            }
        }

        private async Task<(string Segment, BlobAppendInfo Append, long Length)> AppendBlockAsync(
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
                    new JsonSerializerSettings()
                    {
                        StringEscapeHandling = StringEscapeHandling.Default,
                    }
                ) + Environment.NewLine;

            var eventBytes = Encoding.UTF8.GetBytes(eventJson);
            var eventStream = new MemoryStream(eventBytes);

            try
            {
                var appendResult = await logSegmentBlob.AppendBlockAsync(eventStream);
                return (logSegmentBlob.Name, appendResult.Value, eventBytes.LongLength);
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

        public IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId,
            Guid locationId
        ) => GetAllEventsAsync(organizationId, locationId, null);

        internal async IAsyncEnumerable<(T DomainEvent, long SequenceNumber)> GetAllEventsAsync(
            Guid organizationId,
            Guid locationId,
            Action<EventLogPosition>? onReplayed
        )
        {
            var tenantContainer = await CreateContainerIfNotExistsAsync(organizationId);

            long eventSequenceNumber = 0;
            EventLogPosition position = new(0, null, default, 0);

            await foreach (
                var blob in tenantContainer.GetBlobsAsync(
                    BlobTraits.None,
                    BlobStates.None,
                    $"{locationId}/{logType}",
                    default
                )
            )
            {
                // Only process correctly named files. This is a reliability measure to protect against
                // files that might be uploaded to the wrong directory accidentally by another process.
                if (!blob.Name.EndsWith(".ndjson"))
                    continue;

                var appendBlob = tenantContainer.GetAppendBlobClient(blob.Name);

                Stream segmentStream;
                if (onReplayed is null)
                    segmentStream = await appendBlob.OpenReadAsync();
                else
                {
                    var download = (await appendBlob.DownloadStreamingAsync()).Value;
                    position = position with
                    {
                        Segment = blob.Name,
                        ETag = download.Details.ETag,
                        Length = download.Details.ContentLength,
                    };
                    segmentStream = download.Content;
                }
                using var eventStream = segmentStream;
                using var reader = new StreamReader(eventStream);

                string? line;

                while ((line = await reader.ReadLineAsync()) != null)
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

            onReplayed?.Invoke(position with { EventCount = eventSequenceNumber });
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
