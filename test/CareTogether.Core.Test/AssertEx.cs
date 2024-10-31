using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Core.Test
{
    public static class AssertEx
    {
        public static void SequenceIs(ICollection<int> actual, params int[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<Guid> actual, params Guid[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<string> actual, params string[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<DateTime> actual, params DateTime[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<DateTime> actual, ICollection<DateTime> expected)
        {
            Assert.AreEqual(expected.Count, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<DateOnly> actual, params DateOnly[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<DateOnly> actual, ICollection<DateOnly> expected)
        {
            Assert.AreEqual(expected.Count, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected.ToImmutableSortedSet(), actual.ToImmutableSortedSet()))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs(ICollection<DateRange>? actual, ICollection<DateRange>? expected)
        {
            Assert.AreEqual(expected?.Count, actual?.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected, actual))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs<T>(ICollection<T> actual, params T[] expected)
            where T : class
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected, actual))
                Assert.AreEqual(First, Second);
        }

        public static void SequenceIs
            (ICollection<MissingArrangementRequirement> actual, params MissingArrangementRequirement[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var (First, Second) in Enumerable
                .Zip(expected, actual))
                Assert.AreEqual(First, Second);
        }

        public static void DictionaryIs(IDictionary<Guid, ImmutableList<string>> actual, params (Guid, string[])[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var e in expected)
            {
                var a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                foreach (var (First, Second) in Enumerable
                    .Zip(e.Item2.ToImmutableSortedSet(), a.ToImmutableSortedSet()))
                    Assert.AreEqual(First, Second);
            }
        }

        public static void DictionaryIs(IDictionary<string, ImmutableList<RoleVersionApproval>> actual, params (string, RoleVersionApproval[])[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (var e in expected)
            {
                var a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                foreach (var (First, Second) in Enumerable
                    .Zip(e.Item2, a))
                    Assert.AreEqual(First, Second);
            }
        }
    }
}
