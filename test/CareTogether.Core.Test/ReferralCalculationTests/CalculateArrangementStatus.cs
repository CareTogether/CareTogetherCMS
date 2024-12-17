using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateArrangementStatus
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');
        static readonly Guid _Guid6 = Id('6');

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        [TestMethod]
        public void Test()
        {
            Assert.Inconclusive("Not implemented");
        }
    }
}
