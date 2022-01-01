using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class ExtensionMethodTests
    {
        [TestMethod]
        public void TestImmutableListWithPredicate()
        {
            var dut = ImmutableList<int>.Empty.Add(1).Add(2).Add(3).Add(4);

            var result = dut.With(3, x => x > 2);

            Assert.AreEqual(4, result.Count);
            Assert.IsTrue(Enumerable.Zip(result, new[] { 1, 2, 3, 3 }).All(tuple => tuple.First == tuple.Second));
        }

        [TestMethod]
        public void TestImmutableDictionaryGetValueOrEmptyListMatch()
        {
            var dut = ImmutableDictionary<char, ImmutableList<int>>.Empty
                .Add('a', ImmutableList<int>.Empty.Add(1).Add(2))
                .Add('b', ImmutableList<int>.Empty.Add(3).Add(4));

            var result = dut.GetValueOrEmptyList('b');

            Assert.AreEqual(2, result.Count);
            Assert.IsTrue(Enumerable.Zip(result, ImmutableList<int>.Empty.Add(3).Add(4)).All(tuple => tuple.First == tuple.Second));
        }

        [TestMethod]
        public void TestImmutableDictionaryGetValueOrEmptyListNoMatch()
        {
            var dut = ImmutableDictionary<char, ImmutableList<int>>.Empty
                .Add('a', ImmutableList<int>.Empty.Add(1).Add(2))
                .Add('b', ImmutableList<int>.Empty.Add(3).Add(4));

            var result = dut.GetValueOrEmptyList('c');

            Assert.AreEqual(0, result.Count);
        }
    }
}
