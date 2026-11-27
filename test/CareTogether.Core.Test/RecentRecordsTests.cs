using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using CareTogether.Api.Controllers;
using CareTogether.Api.Services;
using CareTogether.Managers.Records;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class RecentRecordsTests
    {
        private readonly Guid user = Guid.NewGuid();
        private readonly Guid organization = Guid.NewGuid();
        private readonly Guid location = Guid.NewGuid();

        [TestMethod]
        public void MergeKeepsLatestVisitPerCanonicalKeyAndBoundsHistory()
        {
            var time = DateTimeOffset.UnixEpoch;
            var key = new RecentRecordKey(RecentRecordType.Family, Guid.NewGuid());
            var entries = Enumerable
                .Range(0, 25)
                .Select(i => new RecentRecord(
                    new RecentRecordKey(RecentRecordType.Family, Guid.NewGuid()),
                    time.AddMinutes(i)
                ))
                .Append(new RecentRecord(key, time.AddHours(1)))
                .ToArray();

            var merged = RecentRecordsStore.Merge(entries, new RecentRecord(key, time));
            Assert.HasCount(20, merged);
            Assert.AreEqual(new RecentRecord(key, time.AddHours(1)), merged[0]);
            Assert.HasCount(1, merged.Where(entry => entry.Record == key).ToArray());
            var referral = new RecentRecord(
                key with
                {
                    Type = RecentRecordType.Referral,
                },
                time.AddHours(2)
            );
            Assert.AreEqual(referral, RecentRecordsStore.Merge(merged, referral)[0]);
        }

        [TestMethod]
        public async Task UnmatchedScopeAndInaccessibleVisitDoNotTouchStorage()
        {
            var storage = new Mock<BlobContainerClient>(MockBehavior.Strict);
            var records = new Mock<IRecordsManager>(MockBehavior.Strict);
            var controller = CreateController(records.Object, storage.Object);
            var entry = new RecentRecordKey(RecentRecordType.Family, Guid.NewGuid());

            Assert.IsInstanceOfType<ForbidResult>(
                (
                    await controller.ListAsync(organization, Guid.NewGuid(), CancellationToken.None)
                ).Result
            );
            Assert.IsInstanceOfType<ForbidResult>(
                await controller.RecordAsync(
                    Guid.NewGuid(),
                    location,
                    entry,
                    CancellationToken.None
                )
            );
            records
                .Setup(manager =>
                    manager.FilterVisibleRecentRecordsAsync(
                        controller.User,
                        organization,
                        location,
                        It.IsAny<ImmutableHashSet<RecentRecordKey>>()
                    )
                )
                .ReturnsAsync(ImmutableHashSet<RecentRecordKey>.Empty);
            Assert.IsInstanceOfType<NotFoundResult>(
                await controller.RecordAsync(organization, location, entry, CancellationToken.None)
            );
            storage.VerifyNoOtherCalls();
        }

        [TestMethod]
        [DataRow(false)]
        [DataRow(true)]
        public async Task ConcurrentWriteRetriesAgainstLatestRevisionAndKeepsBothVisits(
            bool initialCreation
        )
        {
            var storage = new Mock<BlobContainerClient>(MockBehavior.Strict);
            var blob = new Mock<BlobClient>(MockBehavior.Strict);
            var cancellationToken = CancellationToken.None;
            var concurrentVisit = new RecentRecord(
                new(RecentRecordType.Organization, Guid.NewGuid()),
                DateTimeOffset.UnixEpoch
            );
            var key = new RecentRecordKey(RecentRecordType.Family, Guid.NewGuid());
            RecentRecord[]? saved = null;
            storage
                .Setup(client =>
                    client.GetBlobClient($"{organization:D}/{location:D}/{user:D}.json")
                )
                .Returns(blob.Object);
            storage
                .Setup(client =>
                    client.CreateIfNotExistsAsync(
                        PublicAccessType.None,
                        null,
                        null,
                        cancellationToken
                    )
                )
                .ReturnsAsync((Response<BlobContainerInfo>)null!);
            var reads = blob.SetupSequence(client =>
                client.DownloadContentAsync(cancellationToken)
            );
            if (initialCreation)
                reads.ThrowsAsync(new RequestFailedException(404, "Missing", "BlobNotFound", null));
            else
                reads.ReturnsAsync(Snapshot([], "first"));
            reads.ReturnsAsync(Snapshot([concurrentVisit], "second"));
            blob.Setup(client =>
                    client.UploadAsync(
                        It.IsAny<BinaryData>(),
                        It.Is<BlobUploadOptions>(options =>
                            initialCreation
                                ? options.Conditions.IfNoneMatch == ETag.All
                                : options.Conditions.IfMatch == new ETag("first")
                        ),
                        cancellationToken
                    )
                )
                .ThrowsAsync(
                    initialCreation
                        ? new RequestFailedException(409, "Conflict", "BlobAlreadyExists", null)
                        : new RequestFailedException(412, "Conflict")
                );
            blob.Setup(client =>
                    client.UploadAsync(
                        It.IsAny<BinaryData>(),
                        It.Is<BlobUploadOptions>(options =>
                            options.Conditions.IfMatch == new ETag("second")
                        ),
                        cancellationToken
                    )
                )
                .Callback<BinaryData, BlobUploadOptions, CancellationToken>(
                    (content, _, _) => saved = content.ToObjectFromJson<RecentRecord[]>()
                )
                .ReturnsAsync((Response<BlobContentInfo>)null!);
            var before = DateTimeOffset.UtcNow;
            var authorizationStarted = DateTimeOffset.MinValue;
            var records = new Mock<IRecordsManager>(MockBehavior.Strict);
            var controller = CreateController(records.Object, storage.Object);
            records
                .Setup(manager =>
                    manager.FilterVisibleRecentRecordsAsync(
                        controller.User,
                        organization,
                        location,
                        It.IsAny<ImmutableHashSet<RecentRecordKey>>()
                    )
                )
                .Callback(() => authorizationStarted = DateTimeOffset.UtcNow)
                .ReturnsAsync(ImmutableHashSet.Create(key));

            Assert.IsInstanceOfType<NoContentResult>(
                await controller.RecordAsync(organization, location, key, cancellationToken)
            );

            Assert.IsNotNull(saved);
            Assert.HasCount(2, saved);
            Assert.AreEqual(key, saved[0].Record);
            Assert.IsTrue(saved[0].AccessedAtUtc >= before);
            Assert.IsTrue(saved[0].AccessedAtUtc <= authorizationStarted);
            Assert.AreEqual(concurrentVisit, saved[1]);
        }

        [TestMethod]
        public async Task RetrievalOnlyReturnsRecordsStillVisibleInAuthenticatedScope()
        {
            var now = DateTimeOffset.UnixEpoch;
            var visible = new RecentRecord(new(RecentRecordType.Family, Guid.NewGuid()), now);
            var deleted = new RecentRecord(new(RecentRecordType.Organization, Guid.NewGuid()), now);
            var restricted = new RecentRecord(new(RecentRecordType.Referral, Guid.NewGuid()), now);
            var storage = new Mock<BlobContainerClient>(MockBehavior.Strict);
            var blob = new Mock<BlobClient>(MockBehavior.Strict);
            storage
                .Setup(client =>
                    client.GetBlobClient($"{organization:D}/{location:D}/{user:D}.json")
                )
                .Returns(blob.Object);
            blob.Setup(client => client.DownloadContentAsync(CancellationToken.None))
                .ReturnsAsync(Snapshot([visible, deleted, restricted], "test"));
            var records = new Mock<IRecordsManager>(MockBehavior.Strict);
            var controller = CreateController(records.Object, storage.Object);
            records
                .Setup(manager =>
                    manager.FilterVisibleRecentRecordsAsync(
                        controller.User,
                        organization,
                        location,
                        It.IsAny<ImmutableHashSet<RecentRecordKey>>()
                    )
                )
                .ReturnsAsync(ImmutableHashSet.Create(visible.Record));

            var result =
                (await controller.ListAsync(organization, location, CancellationToken.None)).Result
                as OkObjectResult;
            CollectionAssert.AreEqual(new[] { visible }, (RecentRecord[])result!.Value!);
        }

        private static Response<BlobDownloadResult> Snapshot(
            RecentRecord[] entries,
            string revision
        ) =>
            Response.FromValue(
                BlobsModelFactory.BlobDownloadResult(
                    content: BinaryData.FromObjectAsJson(entries),
                    details: BlobsModelFactory.BlobDownloadDetails(eTag: new ETag(revision))
                ),
                Mock.Of<Response>()
            );

        private RecentRecordsController CreateController(
            IRecordsManager records,
            BlobContainerClient container
        ) =>
            new(records, new RecentRecordsStore(container))
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(
                            new[]
                            {
                                new ClaimsIdentity(
                                    new[]
                                    {
                                        new Claim(Claims.UserId, user.ToString()),
                                        new Claim(Claims.OrganizationId, organization.ToString()),
                                    },
                                    "test"
                                ),
                                new ClaimsIdentity(
                                    new[] { new Claim(Claims.LocationId, location.ToString()) },
                                    $"{organization}:{location}"
                                ),
                            }
                        ),
                    },
                },
            };
    }
}
