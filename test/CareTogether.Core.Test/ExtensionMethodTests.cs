using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Collections.Immutable;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class ExtensionMethodTests
    {
        [TestMethod]
        public void TestImmutableListWithPredicate()
        {
            var dut = ImmutableList<int>.Empty.Add(1).Add(2).Add(3).Add(4);

            var result = dut.With(5, x => x > 2);

            AssertEx.SequenceIs(result, 1, 2, 5, 5);
        }

        [TestMethod]
        public void TestImmutableDictionaryGetValueOrEmptyListMatch()
        {
            var dut = ImmutableDictionary<char, ImmutableList<int>>.Empty
                .Add('a', ImmutableList<int>.Empty.Add(1).Add(2))
                .Add('b', ImmutableList<int>.Empty.Add(3).Add(4));

            var result = dut.GetValueOrEmptyList('b');

            AssertEx.SequenceIs(result, 3, 4);
        }

        [TestMethod]
        public void TestImmutableDictionaryGetValueOrEmptyListNoMatch()
        {
            var dut = ImmutableDictionary<char, ImmutableList<int>>.Empty
                .Add('a', ImmutableList<int>.Empty.Add(1).Add(2))
                .Add('b', ImmutableList<int>.Empty.Add(3).Add(4));

            var result = dut.GetValueOrEmptyList('c');

            AssertEx.SequenceIs(result);
        }
    }
}
