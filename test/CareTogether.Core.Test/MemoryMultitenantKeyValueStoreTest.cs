using CareTogether.Utilities;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class MemoryMultitenantKeyValueStoreTest
    {
        static readonly Guid guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        static readonly Guid guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        static readonly Guid guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        static readonly Guid guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");


        [TestMethod]
        public async Task GettingNonexistentValueReturnsNotFound()
        {
            var dut = new MemoryMultitenantKeyValueStore<int>();

            var result = await dut.GetValueAsync(guid1, guid2, guid3);
            Assert.IsTrue(result.IsT1);
        }

        [TestMethod]
        public async Task GettingUpsertedValueReturnsValue()
        {
            var dut = new MemoryMultitenantKeyValueStore<int>();

            await dut.UpsertValueAsync(guid1, guid2, guid3, 123);
            var result = await dut.GetValueAsync(guid1, guid2, guid3);
            Assert.AreEqual(123, result.AsT0);
        }

        [TestMethod]
        public async Task GettingTwiceUpsertedValueReturnsValue()
        {
            var dut = new MemoryMultitenantKeyValueStore<int>();

            await dut.UpsertValueAsync(guid1, guid2, guid3, 123);
            await dut.UpsertValueAsync(guid1, guid2, guid3, 456);
            var result = await dut.GetValueAsync(guid1, guid2, guid3);
            Assert.AreEqual(456, result.AsT0);
        }

        [TestMethod]
        public async Task InitialValuesArePopulated()
        {
            var dut = new MemoryMultitenantKeyValueStore<int>(new Dictionary<(Guid, Guid, Guid), int>
            {
                [(guid1, guid2, guid3)] = 123,
                [(guid1, guid2, guid4)] = 124,
                [(guid1, guid3, guid2)] = 132,
                [(guid2, guid1, guid3)] = 213
            });

            Assert.AreEqual(123, (await dut.GetValueAsync(guid1, guid2, guid3)).AsT0);
            Assert.AreEqual(124, (await dut.GetValueAsync(guid1, guid2, guid4)).AsT0);
            Assert.AreEqual(132, (await dut.GetValueAsync(guid1, guid3, guid2)).AsT0);
            Assert.AreEqual(213, (await dut.GetValueAsync(guid2, guid1, guid3)).AsT0);
        }

        [TestMethod]
        public void QueryingValuesReturnsAllValuesForTheTenant()
        {
            var dut = new MemoryMultitenantKeyValueStore<int>(new Dictionary<(Guid, Guid, Guid), int>
            {
                [(guid1, guid2, guid3)] = 123,
                [(guid1, guid2, guid4)] = 124,
                [(guid1, guid3, guid2)] = 132,
                [(guid1, guid3, guid4)] = 134,
                [(guid2, guid1, guid3)] = 213,
                [(guid2, guid1, guid4)] = 214
            });

            var result = dut.QueryValues(guid1, guid3)
                .ToList();
            Assert.AreEqual(2, result.Count);
            Assert.AreEqual(132, result[0]);
            Assert.AreEqual(134, result[1]);
        }
    }
}
