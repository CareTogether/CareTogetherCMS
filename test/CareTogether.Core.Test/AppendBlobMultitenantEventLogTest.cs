using System;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Utilities;
using CareTogether.TestData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using CareTogether.Abstractions;
using System.Collections.Generic;
using System.Linq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class AppendBlobMultitenantEventLogTest
    {
        BlobServiceClient testingClient;
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        static readonly Guid organizationId = Id('1');

        // locationId must be seeded with 2 because PopulateTestDataAsync creates data in that locationId only
        static readonly Guid locationId = Id('2');
        static readonly Guid guid1 = Id('3');
        static readonly Guid guid2 = Id('4');

        static readonly PersonCommandExecuted personCommand = new PersonCommandExecuted(new CreatePerson(guid1, guid2, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1))));

        IMultitenantEventLog<CommunityEvent> communityEventLog;
        IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog;
        IMultitenantEventLog<ReferralEvent> referralsEventLog;

        [TestInitialize]
        public async Task TestInitialize()
        {
            testingClient = new BlobServiceClient("UseDevelopmentStorage=true");

            communityEventLog = new AppendBlobMultitenantEventLog<CommunityEvent>(testingClient, LogType.CommunityEventLog);
            contactsEventLog = new AppendBlobMultitenantEventLog<ContactCommandExecutedEvent>(testingClient, LogType.ContactsEventLog);
            referralsEventLog = new AppendBlobMultitenantEventLog<ReferralEvent>(testingClient, LogType.ReferralsEventLog);
        }

        [TestMethod]
        public async Task ResultsFromContainerAfterTestDataPopulationMatchesExpected()
        {
            ResetContainerByOrganizationId(testingClient, organizationId);

            TestData.TestDataProvider.PopulateTestDataAsync(
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
            ResetContainerByOrganizationId(testingClient, organizationId);
            communityEventLog = new AppendBlobMultitenantEventLog<CommunityEvent>(testingClient, LogType.CommunityEventLog);

            var result = communityEventLog.GetAllEventsAsync(organizationId, locationId);
            Assert.AreEqual(0, await result.CountAsync());
        }

        [TestMethod]
        public async Task GettingPreviouslyInitializedTenantLogReturnsSameSequence()
        {
            var result1 = communityEventLog.GetAllEventsAsync(organizationId, locationId);
            var result2 = communityEventLog.GetAllEventsAsync(organizationId, locationId);
            Assert.AreEqual(0, await result1.CountAsync());
            Assert.AreEqual(0, await result2.CountAsync());
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogStoresItWithTheCorrectSequenceNumber()
        {
            ResetContainerByOrganizationId(testingClient, organizationId);

            var appendResult = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult.IsT0);
            Assert.AreEqual(1, getResult.Count);
            Assert.AreEqual(1, getResult[0].SequenceNumber);
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogValidatesTheExpectedSequenceNumber()
        {
            ResetContainerByOrganizationId(testingClient, organizationId);

            var appendResult = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult.IsT1);
            Assert.AreEqual(1, getResult.Count);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnUninitializedTenantLogStoresThemCorrectly()
        {
            ResetContainerByOrganizationId(testingClient, organizationId);

            var appendResult1 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1);
            var appendResult2 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2);
            var appendResult3 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 3);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult1.IsT0);
            Assert.IsTrue(appendResult2.IsT0);
            Assert.IsTrue(appendResult3.IsT0);
            Assert.AreEqual(3, getResult.Count);
            Assert.AreEqual((personCommand, 1), getResult[0]);
            Assert.AreEqual((personCommand, 2), getResult[1]);
            Assert.AreEqual((personCommand, 3), getResult[2]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnInitializedTenantLogStoresThemCorrectly()
        {
            var appendResult1 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 4);
            var appendResult2 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 5);
            var appendResult3 = await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 6);
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResult1.IsT0);
            Assert.IsTrue(appendResult2.IsT0);
            Assert.IsTrue(appendResult3.IsT0);
            Assert.AreEqual(6, getResult.Count);
            Assert.AreEqual((personCommand, 4), getResult[3]);
            Assert.AreEqual((personCommand, 5), getResult[4]);
            Assert.AreEqual((personCommand, 6), getResult[5]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToMultipleTenantLogsMaintainsSeparation()
        {
            ResetContainerByOrganizationId(testingClient, organizationId);
            ResetContainerByOrganizationId(testingClient, guid1);

            var appendResults = new[]
            {
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 1),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 2),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 3),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 4),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 5),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 6),
                await communityEventLog.AppendEventAsync(guid1, guid2, personCommand, 1),
                await communityEventLog.AppendEventAsync(guid1, guid2, personCommand, 2),
                await communityEventLog.AppendEventAsync(guid1, guid2, personCommand, 3),
                await communityEventLog.AppendEventAsync(organizationId, locationId, personCommand, 7)
            };
            var getResult = await communityEventLog.GetAllEventsAsync(organizationId, locationId).ToListAsync();
            Assert.IsTrue(appendResults.All(result => result.IsT0));
            Assert.AreEqual(7, getResult.Count);
            Assert.AreEqual((personCommand, 1), getResult[0]);
            Assert.AreEqual((personCommand, 2), getResult[1]);
            Assert.AreEqual((personCommand, 3), getResult[2]);
        }

        private static void ResetContainerByOrganizationId(BlobServiceClient blobServiceClient, Guid organizationId)
        {
            var tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId.ToString());
            var response = tenantContainer.DeleteIfExists();
        }
    }
}
