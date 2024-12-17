using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class MemoryEventLogTest
    {
        static readonly Guid _Guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid _Guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid _Guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid _Guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");

        [TestMethod]
        public async Task GettingUninitializedTenantLogReturnsEmptySequence()
        {
            MemoryEventLog<int> dut = new();

            IAsyncEnumerable<(int DomainEvent, long SequenceNumber)> result = dut.GetAllEventsAsync(_Guid1, _Guid2);
            Assert.AreEqual(0, await result.CountAsync());
        }

        [TestMethod]
        public async Task GettingPreviouslyInitializedTenantLogReturnsSameSequence()
        {
            MemoryEventLog<int> dut = new();

            IAsyncEnumerable<(int DomainEvent, long SequenceNumber)> result1 = dut.GetAllEventsAsync(_Guid1, _Guid2);
            IAsyncEnumerable<(int DomainEvent, long SequenceNumber)> result2 = dut.GetAllEventsAsync(_Guid1, _Guid2);
            Assert.AreEqual(0, await result1.CountAsync());
            Assert.AreEqual(0, await result2.CountAsync());
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogStoresItWithTheCorrectSequenceNumber()
        {
            MemoryEventLog<int> dut = new();

            await dut.AppendEventAsync(_Guid1, _Guid2, 42, 1);
            List<(int DomainEvent, long SequenceNumber)> getResult = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(1, getResult.Count);
            Assert.AreEqual((42, 1), getResult[0]);
        }

        [TestMethod]
        public async Task AppendingAnEventToAnUninitializedTenantLogValidatesTheExpectedSequenceNumber()
        {
            MemoryEventLog<int> dut = new();

            await Assert.ThrowsExceptionAsync<InvalidOperationException>(
                () => dut.AppendEventAsync(_Guid1, _Guid2, 42, 2)
            );
            List<(int DomainEvent, long SequenceNumber)> getResult = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(0, getResult.Count);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnUninitializedTenantLogStoresThemCorrectly()
        {
            MemoryEventLog<int> dut = new();

            await dut.AppendEventAsync(_Guid1, _Guid2, 41, 1);
            await dut.AppendEventAsync(_Guid1, _Guid2, 42, 2);
            await dut.AppendEventAsync(_Guid1, _Guid2, 43, 3);
            List<(int DomainEvent, long SequenceNumber)> getResult = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(3, getResult.Count);
            Assert.AreEqual((41, 1), getResult[0]);
            Assert.AreEqual((42, 2), getResult[1]);
            Assert.AreEqual((43, 3), getResult[2]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnInitializedTenantLogStoresThemCorrectly()
        {
            MemoryEventLog<int> dut = new();

            List<(int DomainEvent, long SequenceNumber)> getResult1 = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            await dut.AppendEventAsync(_Guid1, _Guid2, 41, 1);
            await dut.AppendEventAsync(_Guid1, _Guid2, 42, 2);
            await dut.AppendEventAsync(_Guid1, _Guid2, 43, 3);
            List<(int DomainEvent, long SequenceNumber)> getResult2 = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(0, getResult1.Count);
            Assert.AreEqual(3, getResult2.Count);
            Assert.AreEqual((41, 1), getResult2[0]);
            Assert.AreEqual((42, 2), getResult2[1]);
            Assert.AreEqual((43, 3), getResult2[2]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToAnUninitializedTenantLogValidatesSequenceNumbers()
        {
            MemoryEventLog<int> dut = new();

            await dut.AppendEventAsync(_Guid1, _Guid2, 41, 1);
            await Assert.ThrowsExceptionAsync<InvalidOperationException>(
                () => dut.AppendEventAsync(_Guid1, _Guid2, 42, 3)
            );
            await dut.AppendEventAsync(_Guid1, _Guid2, 43, 2);
            List<(int DomainEvent, long SequenceNumber)> getResult = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(2, getResult.Count);
            Assert.AreEqual((41, 1), getResult[0]);
            Assert.AreEqual((43, 2), getResult[1]);
        }

        [TestMethod]
        public async Task AppendingMultipleEventsToMultipleTenantLogsMaintainsSeparation()
        {
            MemoryEventLog<int> dut = new();

            await dut.AppendEventAsync(_Guid1, _Guid2, 1, 1);
            await dut.AppendEventAsync(_Guid1, _Guid2, 2, 2);
            await dut.AppendEventAsync(_Guid1, _Guid2, 3, 3);
            await dut.AppendEventAsync(_Guid1, _Guid4, 1, 1);
            await dut.AppendEventAsync(_Guid1, _Guid4, 2, 2);
            await dut.AppendEventAsync(_Guid1, _Guid4, 3, 3);
            await dut.AppendEventAsync(_Guid2, _Guid3, 1, 1);
            await dut.AppendEventAsync(_Guid2, _Guid3, 2, 2);
            await dut.AppendEventAsync(_Guid2, _Guid3, 3, 3);
            await dut.AppendEventAsync(_Guid1, _Guid2, 4, 4);

            List<(int DomainEvent, long SequenceNumber)> getResult = await dut.GetAllEventsAsync(_Guid1, _Guid2)
                .ToListAsync();
            Assert.AreEqual(4, getResult.Count);
            Assert.AreEqual((1, 1), getResult[0]);
            Assert.AreEqual((2, 2), getResult[1]);
            Assert.AreEqual((3, 3), getResult[2]);
            Assert.AreEqual((4, 4), getResult[3]);
        }
    }
}
