using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using CareTogether.Utilities.EventLog;
using JsonPolymorph;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [JsonHierarchyBase]
    public abstract partial record TestEvent(int EventId);

    public sealed record TestEventA(int EventId) : TestEvent(EventId);

    public sealed record TestEventB(int EventId) : TestEvent(EventId);

    [TestClass]
    public class AppendBlobEventLogTest
    {
        static readonly BlobServiceClient _TestingClient = new("UseDevelopmentStorage=true");

        // 'organizationId' and 'locationId' must be seeded with 1 and 2, respectively, because
        // PopulateTestDataAsync creates data in that organizationId and locationId only.
        static readonly Guid _OrganizationId = Id('1');
        static readonly Guid _LocationId = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        static async Task AppendEventsAsync<T>(
            IEventLog<T> eventLog,
            Guid organizationId,
            Guid locationId,
            params T[] events
        )
        {
            foreach ((T domainEvent, long index) in events.Select((e, i) => (e, (long)i)))
            {
                await eventLog.AppendEventAsync(organizationId, locationId, domainEvent, index + 1);
            }
        }

        [TestInitialize]
        public void TestInitialize()
        {
            _TestingClient.GetBlobContainerClient(_OrganizationId.ToString()).DeleteIfExists();
            _TestingClient.GetBlobContainerClient(_Guid3.ToString()).DeleteIfExists();

            _DirectoryEventLog = new AppendBlobEventLog<TestEventA>(_TestingClient, "A");
            _ReferralsEventLog = new AppendBlobEventLog<TestEventB>(_TestingClient, "B");
        }

        [TestCleanup]
        public void TestCleanup()
        {
            _TestingClient.GetBlobContainerClient(_OrganizationId.ToString()).DeleteIfExists();
            _TestingClient.GetBlobContainerClient(_Guid3.ToString()).DeleteIfExists();
        }

        [TestMethod]
        public async Task ResultsFromContainerAfterTestDataPopulationMatchesExpected()
        {
            await AppendEventsAsync(
                _DirectoryEventLog,
                _OrganizationId,
                _LocationId,
                new TestEventA(1),
                new TestEventA(2),
                new TestEventA(3)
            );
            await AppendEventsAsync(
                _ReferralsEventLog,
                _OrganizationId,
                _LocationId,
                new TestEventB(1),
                new TestEventB(2)
            );

            List<(TestEventA DomainEvent, long SequenceNumber)> directoryEvents = await _DirectoryEventLog
                .GetAllEventsAsync(_OrganizationId, _LocationId)
                .ToListAsync();

            Assert.AreEqual(3, directoryEvents.Count);
            Assert.AreEqual(typeof(TestEventA), directoryEvents[0].DomainEvent.GetType());
            Assert.AreEqual(typeof(TestEventA), directoryEvents[2].DomainEvent.GetType());

            List<(TestEventB DomainEvent, long SequenceNumber)> referralEvents = await _ReferralsEventLog
                .GetAllEventsAsync(_OrganizationId, _LocationId)
                .ToListAsync();

            Assert.AreEqual(2, referralEvents.Count);
            Assert.AreEqual(typeof(TestEventB), referralEvents[1].DomainEvent.GetType());
        }

        [TestMethod]
        public async Task GettingUninitializedTenantLogReturnsEmptySequence()
        {
            IAsyncEnumerable<(TestEventA DomainEvent, long SequenceNumber)> result =
                _DirectoryEventLog.GetAllEventsAsync(_OrganizationId, _LocationId);
            Assert.AreEqual(0, await result.CountAsync());
        }

        //[TestMethod]
        //public async Task GettingPreviouslyInitializedTenantLogReturnsSameSequence()
        //{
        //    var result1 = directoryEventLog.GetAllEventsAsync(organizationId, locationId);
        //    var result2 = directoryEventLog.GetAllEventsAsync(organizationId, locationId);
        //    Assert.AreEqual(0, await result1.CountAsync());
        //    Assert.AreEqual(0, await result2.CountAsync());
        //}

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogStoresItWithTheCorrectSequenceNumber()
        {
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(1), 1);
            List<(TestEventA DomainEvent, long SequenceNumber)> getResult = await _DirectoryEventLog
                .GetAllEventsAsync(_OrganizationId, _LocationId)
                .ToListAsync();
            Assert.AreEqual(1, getResult.Count);
            Assert.AreEqual(1, getResult[0].SequenceNumber);
        }

        //TODO: Reenable this test once the corresponding bug is fixed.
        //[TestMethod]
        //public async Task AppendingAnEventToAnUninitializedTenantLogValidatesTheExpectedSequenceNumber()
        //{
        //    await Assert.ThrowsExceptionAsync<Exception>(() => directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2));
        //    var getResult = await directoryEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
        //    Assert.AreEqual(1, getResult.Count);
        //}

        // can't really test already initialized container since we can't guarantee test execution order
        //[TestMethod]
        //public async Task AppendingMultipleEventsToAnUninitializedTenantLogStoresThemCorrectly()
        //{
        //    var appendResult1 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1);
        //    var appendResult2 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2);
        //    var appendResult3 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 3);
        //    var getResult = await directoryEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
        //    Assert.IsTrue(appendResult1.IsT0);
        //    Assert.IsTrue(appendResult2.IsT0);
        //    Assert.IsTrue(appendResult3.IsT0);
        //    Assert.AreEqual(3, getResult.Count);
        //    Assert.AreEqual((personCommand, 1), getResult[0]);
        //    Assert.AreEqual((personCommand, 2), getResult[1]);
        //    Assert.AreEqual((personCommand, 3), getResult[2]);
        //}

        //[TestMethod]
        //public async Task AppendingMultipleEventsToAnInitializedTenantLogStoresThemCorrectly()
        //{
        //    var appendResult1 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 4);
        //    var appendResult2 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 5);
        //    var appendResult3 = await directoryEventLog.AppendEventAsync(organizationId, locationId, personCommand, 6);
        //    var getResult = await directoryEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
        //    Assert.IsTrue(appendResult1.IsT0);
        //    Assert.IsTrue(appendResult2.IsT0);
        //    Assert.IsTrue(appendResult3.IsT0);
        //    Assert.AreEqual(6, getResult.Count);
        //    Assert.AreEqual((personCommand, 4), getResult[3]);
        //    Assert.AreEqual((personCommand, 5), getResult[4]);
        //    Assert.AreEqual((personCommand, 6), getResult[5]);
        //}

        [TestMethod]
        public async Task AppendingMultipleEventsToMultipleTenantLogsMaintainsSeparation()
        {
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(1), 1);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(2), 2);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(3), 3);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(4), 4);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(5), 5);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(6), 6);
            await _DirectoryEventLog.AppendEventAsync(_Guid3, _Guid4, new TestEventA(7), 1);
            await _DirectoryEventLog.AppendEventAsync(_Guid3, _Guid4, new TestEventA(8), 2);
            await _DirectoryEventLog.AppendEventAsync(_Guid3, _Guid4, new TestEventA(9), 3);
            await _DirectoryEventLog.AppendEventAsync(_OrganizationId, _LocationId, new TestEventA(10), 7);

            List<(TestEventA DomainEvent, long SequenceNumber)> getResult = await _DirectoryEventLog
                .GetAllEventsAsync(_OrganizationId, _LocationId)
                .ToListAsync();
            Assert.AreEqual(7, getResult.Count);
            Assert.AreEqual((new TestEventA(1), 1), getResult[0]);
            Assert.AreEqual((new TestEventA(2), 2), getResult[1]);
            Assert.AreEqual((new TestEventA(3), 3), getResult[2]);
            Assert.AreEqual((new TestEventA(10), 7), getResult[6]);
        }

        [TestMethod]
        public void BlobNumberCalculatedCorrectly()
        {
            long firstResult = _DirectoryEventLog.getBlobNumber(1);
            long secondResult = _DirectoryEventLog.getBlobNumber(49999);
            long thirdResult = _DirectoryEventLog.getBlobNumber(50000);
            long fourthResult = _DirectoryEventLog.getBlobNumber(50001);
            long fifthResult = _DirectoryEventLog.getBlobNumber(485919);

            Assert.AreEqual(1, firstResult);
            Assert.AreEqual(1, secondResult);
            Assert.AreEqual(1, thirdResult);
            Assert.AreEqual(2, fourthResult);
            Assert.AreEqual(10, fifthResult);
        }

        [TestMethod]
        public void BlockNumberCalculatedCorrectly()
        {
            long firstResult = _DirectoryEventLog.getBlockNumber(1);
            long secondResult = _DirectoryEventLog.getBlockNumber(49999);
            long thirdResult = _DirectoryEventLog.getBlockNumber(50000);
            long fourthResult = _DirectoryEventLog.getBlockNumber(50001);
            long fifthResult = _DirectoryEventLog.getBlockNumber(485919);

            Assert.AreEqual(1, firstResult);
            Assert.AreEqual(49999, secondResult);
            Assert.AreEqual(50000, thirdResult);
            Assert.AreEqual(1, fourthResult);
            Assert.AreEqual(35919, fifthResult);
        }

#nullable disable
        AppendBlobEventLog<TestEventA> _DirectoryEventLog;
        AppendBlobEventLog<TestEventB> _ReferralsEventLog;

#nullable restore
    }
}
