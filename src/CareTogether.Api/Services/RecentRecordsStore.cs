using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using CareTogether.Managers.Records;

namespace CareTogether.Api.Services
{
    public sealed class RecentRecordsStore(BlobContainerClient container)
    {
        private const int MaximumEntries = 20;
        private const int MaximumAttempts = 5;

        public async Task<RecentRecord[]> ListAsync(
            Guid userId,
            Guid organizationId,
            Guid locationId,
            CancellationToken cancellationToken
        ) =>
            (
                await ReadAsync(GetBlob(userId, organizationId, locationId), cancellationToken)
            ).Entries;

        public async Task RecordAsync(
            Guid userId,
            Guid organizationId,
            Guid locationId,
            RecentRecord visit,
            CancellationToken cancellationToken
        )
        {
            var blob = GetBlob(userId, organizationId, locationId);
            await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

            for (var attempt = 1; ; attempt++)
            {
                var (entries, revision) = await ReadAsync(blob, cancellationToken);
                try
                {
                    await blob.UploadAsync(
                        BinaryData.FromObjectAsJson(Merge(entries, visit)),
                        new BlobUploadOptions
                        {
                            HttpHeaders = new BlobHttpHeaders { ContentType = "application/json" },
                            Conditions = revision is { } etag
                                ? new BlobRequestConditions { IfMatch = etag }
                                : new BlobRequestConditions { IfNoneMatch = ETag.All },
                        },
                        cancellationToken
                    );
                    return;
                }
                catch (RequestFailedException ex)
                    when (attempt < MaximumAttempts
                        && (ex.Status == 412 || ex.ErrorCode == BlobErrorCode.BlobAlreadyExists)
                    )
                {
                    await Task.Delay(Random.Shared.Next(10, 40) * attempt, cancellationToken);
                }
            }
        }

        public static RecentRecord[] Merge(RecentRecord[] entries, RecentRecord visit) =>
            entries
                .Append(visit)
                .OrderByDescending(entry => entry.AccessedAtUtc)
                .ThenBy(entry => entry.Record.Type)
                .ThenBy(entry => entry.Record.Id)
                .DistinctBy(entry => entry.Record)
                .Take(MaximumEntries)
                .ToArray();

        private BlobClient GetBlob(Guid userId, Guid organizationId, Guid locationId) =>
            container.GetBlobClient($"{organizationId:D}/{locationId:D}/{userId:D}.json");

        private static async Task<(RecentRecord[] Entries, ETag? Revision)> ReadAsync(
            BlobClient blob,
            CancellationToken cancellationToken
        )
        {
            try
            {
                var response = await blob.DownloadContentAsync(cancellationToken);
                return (
                    response.Value.Content.ToObjectFromJson<RecentRecord[]>() ?? [],
                    response.Value.Details.ETag
                );
            }
            catch (RequestFailedException ex)
                when (ex.ErrorCode == BlobErrorCode.BlobNotFound
                    || ex.ErrorCode == BlobErrorCode.ContainerNotFound
                )
            {
                return ([], null);
            }
        }
    }
}
