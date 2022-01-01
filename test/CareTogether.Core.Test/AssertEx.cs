using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;

namespace CareTogether.Core.Test
{
    public static class AssertEx
    {
        public static void SequenceIs(ICollection<int> actual, params int[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable.Zip(actual, expected).All(tuple => tuple.First == tuple.Second));
        }

        public static void SequenceIs(ICollection<Guid> actual, params Guid[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable.Zip(actual, expected).All(tuple => tuple.First == tuple.Second));
        }

        public static void SequenceIs<T>(ICollection<T> actual, params T[] expected)
            where T : class
        {
            Assert.AreEqual(expected.Length, actual.Count);
            Assert.IsTrue(Enumerable.Zip(actual, expected).All(tuple => tuple.First == tuple.Second));
        }
    }
}
