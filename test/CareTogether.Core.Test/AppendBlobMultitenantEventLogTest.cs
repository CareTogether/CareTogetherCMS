using System;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Utilities;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class AppendBlobMultitenantEventLogTest
    {
        BlobServiceClient testingClient;
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid organizationId = Id('1');
        static readonly Guid locationId = Id('2');
        static readonly Guid guid1 = Id('3');
        static readonly Guid guid2 = Id('4');
        AppendBlobMultitenantEventLog<CommunityEvent> communityEventLog;

        [TestInitialize]
        public async Task TestInitialize()
        {
            testingClient = new BlobServiceClient("UseDevelopmentStorage=true");
            communityEventLog = new AppendBlobMultitenantEventLog<CommunityEvent>(testingClient, LogType.CommunityEventLog);
        }

        [TestMethod]
        public async Task TestAppend()
        {
            await communityEventLog.AppendEventAsync(organizationId, locationId,
                new PersonCommandExecuted(new CreatePerson(guid1, guid2, "Jane", "Smith", new AgeInYears(42, new DateTime(2021, 1, 1)))), 0);
        }

        [TestMethod]
        public async Task TestLoadEvents()
        {
            await foreach ((CommunityEvent, long) item in communityEventLog.GetAllEventsAsync(organizationId, locationId)) {
                Console.Write(item);
            }
        }
    }
}
