using System;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Collections.Generic;
using System.Linq;
using OneOf;
using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class AppendBlobMultitenantEventLogTest
    {
        BlobServiceClient testingClient;
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        // 'organizationId' and 'locationId' must be seeded with 1 and 2, respectively, because
        // PopulateTestDataAsync creates data in that organizationId and locationId only.
        static readonly Guid organizationId = Id('1');
        static readonly Guid locationId = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');

        static readonly PersonCommandExecuted personCommand = new PersonCommandExecuted(guid4, new DateTime(2021, 7, 1),
            new CreatePerson(guid3, guid4, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1))));

        AppendBlobMultitenantEventLog<CommunityEvent> communityEventLog;
        AppendBlobMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog;
        AppendBlobMultitenantEventLog<ReferralEvent> referralsEventLog;

        [TestInitialize]
        public void TestInitialize()
        {
            testingClient = new BlobServiceClient("UseDevelopmentStorage=true");

            testingClient.GetBlobContainerClient(organizationId.ToString()).DeleteIfExists();
            testingClient.GetBlobContainerClient(guid3.ToString()).DeleteIfExists();

            communityEventLog = new AppendBlobMultitenantEventLog<CommunityEvent>(testingClient, LogType.CommunityEventLog);
            contactsEventLog = new AppendBlobMultitenantEventLog<ContactCommandExecutedEvent>(testingClient, LogType.ContactsEventLog);
            referralsEventLog = new AppendBlobMultitenantEventLog<ReferralEvent>(testingClient, LogType.ReferralsEventLog);
        }

        [TestCleanup]
        public void TestCleanup()
        {
            testingClient.GetBlobContainerClient(organizationId.ToString()).DeleteIfExists();
            testingClient.GetBlobContainerClient(guid3.ToString()).DeleteIfExists();
        }

        [TestMethod]
        public async Task ResultsFromContainerAfterTestDataPopulationMatchesExpected()
        {
            TestDataProvider.PopulateTestDataAsync(
                    communityEventLog, contactsEventLog, null, referralsEventLog).Wait();

            var communityEvents = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();

            Assert.AreEqual(23, communityEvents.Count);
            Assert.AreEqual(typeof(FamilyCommandExecuted), communityEvents[10].DomainEvent.GetType());

            var contactEvents = await contactsEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();

            Assert.AreEqual(11, contactEvents.Count);
            Assert.AreEqual(typeof(ContactCommandExecutedEvent), contactEvents[8].DomainEvent.GetType());

            var referralEvents = await referralsEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();

            Assert.AreEqual(20, referralEvents.Count);
            Assert.AreEqual(typeof(ArrangementCommandExecuted), referralEvents[8].DomainEvent.GetType());
        }

        [TestMethod]
        public async Task GettingUninitializedTenantLogReturnsEmptySequence()
        {
            var result = communityEventLog.GetAllEventsAsync(organizationId, locationId);
            Assert.AreEqual(0, await result.CountAsync());
        }

        //[TestMethod]
        //public async Task GettingPreviouslyInitializedTenantLogReturnsSameSequence()
        //{
        //    var result1 = communityEventLog.GetAllEventsAsync(organizationId, locationId);
        //    var result2 = communityEventLog.GetAllEventsAsync(organizationId, locationId);
        //    Assert.AreEqual(0, await result1.CountAsync());
        //    Assert.AreEqual(0, await result2.CountAsync());
        //}

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogStoresItWithTheCorrectSequenceNumber()
        {
            var appendResult = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult.IsT0);
            Assert.AreEqual(1, getResult.Count);
            Assert.AreEqual(1, getResult[0].SequenceNumber);
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogValidatesTheExpectedSequenceNumber()
        {
            var appendResult = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult.IsT1);
            Assert.AreEqual(1, getResult.Count);
        }

        // can't really test already initialized container since we can't guarantee test execution order
        //[TestMethod]
        //public async Task AppendingMultipleEventsToAnUninitializedTenantLogStoresThemCorrectly()
        //{
        //    var appendResult1 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1);
        //    var appendResult2 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2);
        //    var appendResult3 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 3);
        //    var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
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
        //    var appendResult1 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 4);
        //    var appendResult2 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 5);
        //    var appendResult3 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 6);
        //    var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
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
            var appendResults = new[]
            {
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 3),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 4),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 5),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 6),
                await communityEventLog.AppendEventAsync(guid3, guid4, personCommand, 1),
                await communityEventLog.AppendEventAsync(guid3, guid4, personCommand, 2),
                await communityEventLog.AppendEventAsync(guid3, guid4, personCommand, 3),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 7)
            };
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResults.All(result => result.IsT0));
            Assert.AreEqual(7, getResult.Count);
            Assert.AreEqual((personCommand, 1), getResult[0]);
            Assert.AreEqual((personCommand, 2), getResult[1]);
            Assert.AreEqual((personCommand, 3), getResult[2]);
        }

        [TestMethod]
        public void BlobNumberCalculatedCorrectly()
        {
            var firstResult = communityEventLog.getBlobNumber(1);
            var secondResult = communityEventLog.getBlobNumber(49999);
            var thirdResult = communityEventLog.getBlobNumber(50000);
            var fourthResult = communityEventLog.getBlobNumber(50001);
            var fifthResult = communityEventLog.getBlobNumber(485919);

            Assert.AreEqual(1, firstResult);
            Assert.AreEqual(1, secondResult);
            Assert.AreEqual(1, thirdResult);
            Assert.AreEqual(2, fourthResult);
            Assert.AreEqual(10, fifthResult);
        }

        [TestMethod]
        public void BlockNumberCalculatedCorrectly()
        {
            var firstResult = communityEventLog.getBlockNumber(1);
            var secondResult = communityEventLog.getBlockNumber(49999);
            var thirdResult = communityEventLog.getBlockNumber(50000);
            var fourthResult = communityEventLog.getBlockNumber(50001);
            var fifthResult = communityEventLog.getBlockNumber(485919);

            Assert.AreEqual(1, firstResult);
            Assert.AreEqual(49999, secondResult);
            Assert.AreEqual(50000, thirdResult);
            Assert.AreEqual(1, fourthResult);
            Assert.AreEqual(35919, fifthResult);
        }
    }
}
