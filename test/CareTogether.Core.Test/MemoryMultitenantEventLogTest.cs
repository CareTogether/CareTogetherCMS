using CareTogether.Resources.Storage;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class MemoryMultitenantEventLogTest
    {
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");


        [TestMethod]
        public async Task GettingUninitializedTenantLogReturnsEmptySequence()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var result = dut.GetAllEventsAsync(guid1, guid2);
            Assert.AreEqual(0, await result.CountAsync());
        }

        [TestMethod]
        public async Task GettingPreviouslyInitializedTenantLogReturnsSameSequence()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var result1 = dut.GetAllEventsAsync(guid1, guid2);
            var result2 = dut.GetAllEventsAsync(guid1, guid2);
            Assert.AreEqual(0, await result1.CountAsync());
            Assert.AreEqual(0, await result2.CountAsync());
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogStoresItWithTheCorrectSequenceNumber()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var appendResult = await dut.AppendEventAsync(guid1, guid2, 42, 1);
            var getResult = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResult.IsT0);
            Assert.AreEqual(1, getResult.Count);
            Assert.AreEqual((42, 1), getResult[0]);
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogValidatesTheExpectedSequenceNumber()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var appendResult = await dut.AppendEventAsync(guid1, guid2, 42, 2);
            var getResult = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResult.IsT1);
            Assert.AreEqual(0, getResult.Count);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnUninitializedTenantLogStoresThemCorrectly()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var appendResult1 = await dut.AppendEventAsync(guid1, guid2, 41, 1);
            var appendResult2 = await dut.AppendEventAsync(guid1, guid2, 42, 2);
            var appendResult3 = await dut.AppendEventAsync(guid1, guid2, 43, 3);
            var getResult = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResult1.IsT0);
            Assert.IsTrue(appendResult2.IsT0);
            Assert.IsTrue(appendResult3.IsT0);
            Assert.AreEqual(3, getResult.Count);
            Assert.AreEqual((41, 1), getResult[0]);
            Assert.AreEqual((42, 2), getResult[1]);
            Assert.AreEqual((43, 3), getResult[2]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnInitializedTenantLogStoresThemCorrectly()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var getResult1 = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            var appendResult1 = await dut.AppendEventAsync(guid1, guid2, 41, 1);
            var appendResult2 = await dut.AppendEventAsync(guid1, guid2, 42, 2);
            var appendResult3 = await dut.AppendEventAsync(guid1, guid2, 43, 3);
            var getResult2 = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResult1.IsT0);
            Assert.IsTrue(appendResult2.IsT0);
            Assert.IsTrue(appendResult3.IsT0);
            Assert.AreEqual(0, getResult1.Count);
            Assert.AreEqual(3, getResult2.Count);
            Assert.AreEqual((41, 1), getResult2[0]);
            Assert.AreEqual((42, 2), getResult2[1]);
            Assert.AreEqual((43, 3), getResult2[2]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnUninitializedTenantLogValidatesSequenceNumbers()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var appendResult1 = await dut.AppendEventAsync(guid1, guid2, 41, 1);
            var appendResult2 = await dut.AppendEventAsync(guid1, guid2, 42, 3);
            var appendResult3 = await dut.AppendEventAsync(guid1, guid2, 43, 2);
            var getResult = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResult1.IsT0);
            Assert.IsTrue(appendResult2.IsT1);
            Assert.IsTrue(appendResult3.IsT0);
            Assert.AreEqual(2, getResult.Count);
            Assert.AreEqual((41, 1), getResult[0]);
            Assert.AreEqual((43, 2), getResult[1]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToMultipleTenantLogsMaintainsSeparation()
        {
            var dut = new MemoryMultitenantEventLog<int>();

            var appendResults = new[]
            {
                await dut.AppendEventAsync(guid1, guid2, 1, 1),
                await dut.AppendEventAsync(guid1, guid2, 2, 2),
                await dut.AppendEventAsync(guid1, guid2, 3, 3),
                await dut.AppendEventAsync(guid1, guid4, 1, 1),
                await dut.AppendEventAsync(guid1, guid4, 2, 2),
                await dut.AppendEventAsync(guid1, guid4, 3, 3),
                await dut.AppendEventAsync(guid2, guid3, 1, 1),
                await dut.AppendEventAsync(guid2, guid3, 2, 2),
                await dut.AppendEventAsync(guid2, guid3, 3, 3),
                await dut.AppendEventAsync(guid1, guid2, 4, 4)
            };
            var getResult = await dut.GetAllEventsAsync(guid1, guid2).ToListAsync();
            Assert.IsTrue(appendResults.All(result => result.IsT0));
            Assert.AreEqual(4, getResult.Count);
            Assert.AreEqual((1, 1), getResult[0]);
            Assert.AreEqual((2, 2), getResult[1]);
            Assert.AreEqual((3, 3), getResult[2]);
            Assert.AreEqual((4, 4), getResult[3]);
        }
    }
}
