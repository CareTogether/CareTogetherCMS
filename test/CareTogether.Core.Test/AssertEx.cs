using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;

namespace CareTogether.Core.Test
{
    public static class AssertEx
    {
        public static void SequenceIs(ICollection<int> actual, params int[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach ((int first, int second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet()))
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<Guid> actual, params Guid[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach ((Guid first, Guid second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet()))
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<string> actual, params string[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (
                (string first, string second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet())
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<DateTime> actual, params DateTime[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (
                (DateTime first, DateTime second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet())
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<DateTime> actual, ICollection<DateTime> expected)
        {
            Assert.AreEqual(expected.Count, actual.Count);
            foreach (
                (DateTime first, DateTime second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet())
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<DateOnly> actual, params DateOnly[] expected)
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (
                (DateOnly first, DateOnly second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet())
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<DateOnly> actual, ICollection<DateOnly> expected)
        {
            Assert.AreEqual(expected.Count, actual.Count);
            foreach (
                (DateOnly first, DateOnly second) in expected.ToImmutableSortedSet().Zip(actual.ToImmutableSortedSet())
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(ICollection<DateRange>? actual, ICollection<DateRange>? expected)
        {
            if (actual == null && expected == null)
            {
                return;
            }

            Assert.AreEqual(expected?.Count, actual?.Count);
            foreach ((DateRange first, DateRange second) in expected.Zip(actual))
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(DateOnlyTimeline? actual, DateOnlyTimeline? expected)
        {
            if (actual == null && expected == null)
            {
                return;
            }

            if (actual == null || expected == null)
            {
                throw new ArgumentException("Values are different");
            }

            if (expected.Equals(actual) != true)
            {
                throw new ArgumentException("Timelines are different");
            }
        }

        public static void SequenceIs<T>(ICollection<T> actual, params T[] expected)
            where T : class
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach ((T first, T second) in expected.Zip(actual))
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void SequenceIs(
            ICollection<MissingArrangementRequirement> actual,
            params MissingArrangementRequirement[] expected
        )
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach (
                (MissingArrangementRequirement first, MissingArrangementRequirement second) in expected.Zip(actual)
            )
            {
                Assert.AreEqual(first, second);
            }
        }

        public static void DictionaryIs(
            IDictionary<Guid, ImmutableList<string>> actual,
            params (Guid, string[])[] expected
        )
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach ((Guid, string[]) e in expected)
            {
                ImmutableList<string> a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                foreach ((string first, string second) in e.Item2.ToImmutableSortedSet().Zip(a.ToImmutableSortedSet()))
                {
                    Assert.AreEqual(first, second);
                }
            }
        }

        public static void DictionaryIs(
            IDictionary<string, ImmutableList<RoleVersionApproval>> actual,
            params (string, RoleVersionApproval[])[] expected
        )
        {
            Assert.AreEqual(expected.Length, actual.Count);
            foreach ((string, RoleVersionApproval[]) e in expected)
            {
                ImmutableList<RoleVersionApproval> a = actual[e.Item1];
                Assert.AreEqual(e.Item2.Length, a.Count);
                foreach ((RoleVersionApproval first, RoleVersionApproval second) in e.Item2.Zip(a))
                {
                    Assert.AreEqual(first, second);
                }
            }
        }
    }
}
