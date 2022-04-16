using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class TimelineTest
    {
        private static DateTime D(int day) => new DateTime(2022, 1, day);
        private static TimeSpan T(int days) => TimeSpan.FromDays(days);
        private static MappedTimeSpan M(int start, int end) => new MappedTimeSpan(D(start), D(end));


        [TestMethod]
        public void TestSingleTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))));

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
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(9), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(10), T(5)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(10)));
            Assert.ThrowsException<InvalidOperationException>(() => dut.Map(T(11), T(20)));
        }

        [TestMethod]
        public void TestTwoContinuousTerminatingStages()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(10), D(20))));

            Assert.Fail("Test not implemented");
        }

        [TestMethod]
        public void TestTwoDiscontinuousTerminatingStages()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10)),
                new TerminatingTimelineStage(D(20), D(30))));

            Assert.Fail("Test not implemented");
        }

        [TestMethod]
        public void TestSingleNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList<TerminatingTimelineStage>.Empty,
                new NonTerminatingTimelineStage(D(1)));

            Assert.Fail("Test not implemented");
        }

        [TestMethod]
        public void TestSingleTerminatingAndContinuousNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))),
                new NonTerminatingTimelineStage(D(10)));

            Assert.Fail("Test not implemented");
        }

        [TestMethod]
        public void TestSingleTerminatingAndDiscontinuousNonTerminatingStage()
        {
            var dut = new Timeline(ImmutableList.Create(
                new TerminatingTimelineStage(D(1), D(10))),
                new NonTerminatingTimelineStage(D(20)));

            Assert.Fail("Test not implemented");
        }
    }
}
