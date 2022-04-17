using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class TimelineTest
    {
        private static DateTime D(int day) => new DateTime(2022, 1, day);
        private static TimeSpan T(int days) => TimeSpan.FromDays(days);
        private static AbsoluteTimeSpan M(int start, int end) => new AbsoluteTimeSpan(D(start), D(end));


        [TestMethod]
        public void TestSingleTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsFalse(dut.Contains(D(11)));
            Assert.IsFalse(dut.Contains(D(19)));
            Assert.IsFalse(dut.Contains(D(20)));
            Assert.IsFalse(dut.Contains(D(21)));
            Assert.IsFalse(dut.Contains(D(25)));
            Assert.IsFalse(dut.Contains(D(30)));
            Assert.IsFalse(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(10)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(20)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(25)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(30)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(35)));
            
            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(8), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(9), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(10)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(19)));
        }

        [TestMethod]
        public void TestTwoContinuousTerminatingStages()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(10), D(20))));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsTrue(dut.Contains(D(11)));
            Assert.IsTrue(dut.Contains(D(19)));
            Assert.IsTrue(dut.Contains(D(20)));
            Assert.IsFalse(dut.Contains(D(21)));
            Assert.IsFalse(dut.Contains(D(25)));
            Assert.IsFalse(dut.Contains(D(30)));
            Assert.IsFalse(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.AreEqual(D(11), dut.Map(T(10)));
            Assert.AreEqual(D(12), dut.Map(T(11)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(20)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(25)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(30)));

            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.AreEqual(M(9, 14), dut.Map(T(8), T(5)));
            Assert.AreEqual(M(10, 15), dut.Map(T(9), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(10)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(19)));
        }

        [TestMethod]
        public void TestTwoDiscontinuousTerminatingStages()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(20), D(30))));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsFalse(dut.Contains(D(11)));
            Assert.IsFalse(dut.Contains(D(19)));
            Assert.IsTrue(dut.Contains(D(20)));
            Assert.IsTrue(dut.Contains(D(21)));
            Assert.IsTrue(dut.Contains(D(25)));
            Assert.IsTrue(dut.Contains(D(30)));
            Assert.IsFalse(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.AreEqual(D(21), dut.Map(T(10)));
            Assert.AreEqual(D(22), dut.Map(T(11)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(20)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(25)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(30)));

            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.AreEqual(M(9, 24), dut.Map(T(8), T(5)));
            Assert.AreEqual(M(10, 25), dut.Map(T(9), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(10)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(19)));
        }

        [TestMethod]
        public void TestSingleNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList<TerminatingTimelineStage>.Empty,
                new NonTerminatingTimelineStage(D(1)));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsTrue(dut.Contains(D(11)));
            Assert.IsTrue(dut.Contains(D(19)));
            Assert.IsTrue(dut.Contains(D(20)));
            Assert.IsTrue(dut.Contains(D(21)));
            Assert.IsTrue(dut.Contains(D(25)));
            Assert.IsTrue(dut.Contains(D(30)));
            Assert.IsTrue(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.AreEqual(D(11), dut.Map(T(10)));
            Assert.AreEqual(D(12), dut.Map(T(11)));
            Assert.AreEqual(D(21), dut.Map(T(20)));
            Assert.AreEqual(D(26), dut.Map(T(25)));
            Assert.AreEqual(D(31), dut.Map(T(30)));

            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.AreEqual(M(9, 14), dut.Map(T(8), T(5)));
            Assert.AreEqual(M(10, 15), dut.Map(T(9), T(5)));
            Assert.AreEqual(M(12, 22), dut.Map(T(11), T(10)));
            Assert.AreEqual(M(12, 31), dut.Map(T(11), T(19)));
        }

        [TestMethod]
        public void TestSingleTerminatingAndContinuousNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))),
                new NonTerminatingTimelineStage(D(10)));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsTrue(dut.Contains(D(11)));
            Assert.IsTrue(dut.Contains(D(19)));
            Assert.IsTrue(dut.Contains(D(20)));
            Assert.IsTrue(dut.Contains(D(21)));
            Assert.IsTrue(dut.Contains(D(25)));
            Assert.IsTrue(dut.Contains(D(30)));
            Assert.IsTrue(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.AreEqual(D(11), dut.Map(T(10)));
            Assert.AreEqual(D(12), dut.Map(T(11)));
            Assert.AreEqual(D(21), dut.Map(T(20)));
            Assert.AreEqual(D(26), dut.Map(T(25)));
            Assert.AreEqual(D(31), dut.Map(T(30)));

            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.AreEqual(M(9, 14), dut.Map(T(8), T(5)));
            Assert.AreEqual(M(10, 15), dut.Map(T(9), T(5)));
            Assert.AreEqual(M(12, 22), dut.Map(T(11), T(10)));
            Assert.AreEqual(M(12, 31), dut.Map(T(11), T(19)));
        }

        [TestMethod]
        public void TestSingleTerminatingAndDiscontinuousNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))),
                new NonTerminatingTimelineStage(D(20)));

            Assert.IsTrue(dut.Contains(D(1)));
            Assert.IsTrue(dut.Contains(D(2)));
            Assert.IsTrue(dut.Contains(D(9)));
            Assert.IsTrue(dut.Contains(D(10)));
            Assert.IsFalse(dut.Contains(D(11)));
            Assert.IsFalse(dut.Contains(D(19)));
            Assert.IsTrue(dut.Contains(D(20)));
            Assert.IsTrue(dut.Contains(D(21)));
            Assert.IsTrue(dut.Contains(D(25)));
            Assert.IsTrue(dut.Contains(D(30)));
            Assert.IsTrue(dut.Contains(D(31)));

            Assert.AreEqual(D(1), dut.Map(T(0)));
            Assert.AreEqual(D(2), dut.Map(T(1)));
            Assert.AreEqual(D(10), dut.Map(T(9)));
            Assert.AreEqual(D(21), dut.Map(T(10)));
            Assert.AreEqual(D(22), dut.Map(T(11)));
            Assert.AreEqual(D(31), dut.Map(T(20)));

            Assert.AreEqual(M(1, 1), dut.Map(T(0), T(0)));
            Assert.AreEqual(M(1, 2), dut.Map(T(0), T(1)));
            Assert.AreEqual(M(2, 2), dut.Map(T(1), T(0)));
            Assert.AreEqual(M(2, 3), dut.Map(T(1), T(1)));
            Assert.AreEqual(M(2, 4), dut.Map(T(1), T(2)));
            Assert.AreEqual(M(9, 24), dut.Map(T(8), T(5)));
            Assert.AreEqual(M(10, 25), dut.Map(T(9), T(5)));
            Assert.AreEqual(M(22, 31), dut.Map(T(11), T(9)));
        }
    }
}
