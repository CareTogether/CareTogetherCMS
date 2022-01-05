using CareTogether.Engines;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test
{
    public static class AssertEx
    {
        public static void SequenceIs(ICollection<int> actual, params int[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable
                .Zip(actual.ToImmutableSortedSet(), expected.ToImmutableSortedSet())
                .All(tuple => tuple.First == tuple.Second));
        }

        public static void SequenceIs(ICollection<Guid> actual, params Guid[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable
                .Zip(actual.ToImmutableSortedSet(), expected.ToImmutableSortedSet())
                .All(tuple => tuple.First == tuple.Second));
        }

        public static void SequenceIs(ICollection<string> actual, params string[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable
                .Zip(actual.ToImmutableSortedSet(), expected.ToImmutableSortedSet())
                .All(tuple => tuple.First == tuple.Second));
        }

        public static void SequenceIs<T>(ICollection<T> actual, params T[] expected)
            where T : class
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable
                .Zip(actual, expected)
                .All(tuple => tuple.First == tuple.Second));
        }

        public static void DictionaryIs(IDictionary<Guid, ImmutableList<string>> actual, params (Guid, string[])[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(expected.All(e =>
            {
                var a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                Assert.IsTrue(Enumerable
                    .Zip(a.ToImmutableSortedSet(), e.Item2.ToImmutableSortedSet())
                    .All(tuple => tuple.First == tuple.Second));
                return true;
            }));
        }

        public static void DictionaryIs(IDictionary<string, ImmutableList<RoleVersionApproval>> actual, params (string, RoleVersionApproval[])[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(expected.All(e =>
            {
                var a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                Assert.IsTrue(Enumerable
                    .Zip(a, e.Item2)
                    .All(tuple => tuple.First == tuple.Second));
                return true;
            }));
        }
    }
}
