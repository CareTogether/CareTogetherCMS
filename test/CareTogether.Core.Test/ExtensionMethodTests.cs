using System.Collections.Immutable;
using Microsoft.VisualStudio.TestTools.UnitTesting;

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

        [TestMethod]
        public void TestTakeWhilePlusOne()
        {
            var dut = ImmutableList.Create([1, 2, 3, 4, 5]);

            var result = dut.TakeWhilePlusOne(x => x < 3).ToImmutableList();

            AssertEx.SequenceIs(result, 1, 2, 3);
        }

        [TestMethod]
        public void TestTakeWhilePlusOneWhenPredicateMatchesAll()
        {
            var dut = ImmutableList.Create([1, 2, 3]);

            var result = dut.TakeWhilePlusOne(x => x < 4).ToImmutableList();

            AssertEx.SequenceIs(result, 1, 2, 3);
        }
    }
}
