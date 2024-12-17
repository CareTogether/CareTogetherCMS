namespace Timelines.Test
{
    [TestClass]
    public class DateRangeTest
    {
        static DateOnly D(int day)
        {
            return new DateOnly(2024, 1, day);
        }

        static DateRange DR(int start, int end)
        {
            return new DateRange(D(start), D(end));
        }

        static DateRange DR(int start)
        {
            return new DateRange(D(start));
        }

        static DateRange<T> DR<T>(int start, int end, T tag)
        {
            return new DateRange<T>(D(start), D(end), tag);
        }

        [TestMethod]
        public void DateRangeConstructorWithSingleValueSetsEndToMaxValue()
        {
            DateRange dut = new(D(1));

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(DateOnly.MaxValue, dut.End);
        }

        [TestMethod]
        public void DateRangeConstructorAllowsEndValue()
        {
            DateRange dut = new(D(1), D(2));

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(D(2), dut.End);
        }

        [TestMethod]
        public void DateRangeConstructorAllowsEqualValues()
        {
            DateRange dut = new(D(1), D(1));

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(D(1), dut.End);
        }

        [TestMethod]
        public void TotalDaysInclusiveReturnsCorrectValue()
        {
            DateRange dut1 = new(D(1), D(1));
            DateRange dut2 = new(D(1), D(5));
            DateRange dut3 = new(D(1));

            Assert.AreEqual(dut1.TotalDaysInclusive, 1);
            Assert.AreEqual(dut2.TotalDaysInclusive, 5);
            Assert.AreEqual(dut3.TotalDaysInclusive, DateOnly.MaxValue.DayNumber - D(1).DayNumber + 1);
        }

        [TestMethod]
        public void TakeDaysReturnsExpectedRange()
        {
            DateRange dut = DR(1, 5);
            DateRange result = dut.TakeDays(3);

            Assert.AreEqual(D(1), result.Start);
            Assert.AreEqual(D(3), result.End);
        }

        [TestMethod]
        public void TakeDaysReturnsOriginalRangeWhenRequestedLengthExceedRange()
        {
            DateRange dut = DR(1, 5);
            DateRange result = dut.TakeDays(10);

            Assert.AreEqual(D(1), result.Start);
            Assert.AreEqual(D(5), result.End);
        }

        [TestMethod]
        public void DateRangeConstructorAllowsEndAfterStart()
        {
            DateRange dut = new(D(1), D(2));

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(D(2), dut.End);
        }

        [TestMethod]
        public void DateRangeConstructorForbidsStartAfterEnd()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateRange(D(2), D(1)));
        }

        [DataRow(1, 1, 1, true)]
        [DataRow(1, 1, 2, false)]
        [DataRow(1, 2, 1, true)]
        [DataRow(1, 2, 2, true)]
        [DataRow(1, 2, 3, false)]
        [DataRow(2, 2, 1, false)]
        [DataRow(2, 2, 2, true)]
        [DataRow(2, 4, 3, true)]
        [DataRow(2, 4, 4, true)]
        [DataRow(2, 4, 5, false)]
        [DataTestMethod]
        public void DateRangeContainsHandlesValues(int start, int end, int test, bool expected)
        {
            DateRange dut = new(D(start), D(end));
            Assert.AreEqual(expected, dut.Contains(D(test)));
        }

        [TestMethod]
        public void IntersectionWithNullReturnsNull()
        {
            DateRange dut = DR(1, 2);
            Assert.IsNull(dut.IntersectionWith(null));
        }

        [TestMethod]
        public void IntersectionWithDisjointRangesReturnsNull()
        {
            DateRange dut = DR(1, 2);
            Assert.IsNull(dut.IntersectionWith(DR(3, 4)));
        }

        [TestMethod]
        public void IntersectionWithOverlappingRangesReturnsIntersection()
        {
            DateRange dut = DR(1, 3);
            DateRange? result = dut.IntersectionWith(DR(2, 4));

            Assert.IsNotNull(result);
            Assert.AreEqual(D(2), result.Value.Start);
            Assert.AreEqual(D(3), result.Value.End);
        }

        [TestMethod]
        public void IntersectionWithOverlappingRangesReturnsIntersection2()
        {
            DateRange dut = DR(1, 3);
            DateRange? result = dut.IntersectionWith(DR(2, 2));

            Assert.IsNotNull(result);
            Assert.AreEqual(D(2), result.Value.Start);
            Assert.AreEqual(D(2), result.Value.End);
        }

        [TestMethod]
        public void IntersectionWithOverlappingRangesReturnsIntersection3()
        {
            DateRange dut = DR(2, 3);
            DateRange? result = dut.IntersectionWith(DR(1, 2));

            Assert.IsNotNull(result);
            Assert.AreEqual(D(2), result.Value.Start);
            Assert.AreEqual(D(2), result.Value.End);
        }

        [TestMethod]
        public void EqualsReturnsTrueForSameValues()
        {
            DateRange dut = DR(1, 2);
            Assert.IsTrue(dut.Equals(DR(1, 2)));
        }

        [TestMethod]
        public void EqualsReturnsFalseForDifferentStart()
        {
            DateRange dut = DR(1, 2);
            Assert.IsFalse(dut.Equals(DR(2, 2)));
        }

        [TestMethod]
        public void EqualsReturnsFalseForDifferentEnd()
        {
            DateRange dut = DR(1, 2);
            Assert.IsFalse(dut.Equals(DR(1, 3)));
        }

        [TestMethod]
        public void EqualsReturnsFalseForDifferentStartAndEnd()
        {
            DateRange dut = DR(1, 2);
            Assert.IsFalse(dut.Equals(DR(2, 3)));
        }

        [TestMethod]
        public void EqualsReturnsFalseForNull()
        {
            DateRange dut = DR(1, 2);
            Assert.IsFalse(dut.Equals(null));
        }

        [TestMethod]
        public void EqualsReturnsFalseForDifferentType()
        {
            DateRange dut = DR(1, 2);
            Assert.IsFalse(dut.Equals(1));
        }

        [TestMethod]
        public void GetHashCodeReturnsSameValueForSameValues()
        {
            DateRange dut = DR(1, 2);
            Assert.AreEqual(dut.GetHashCode(), DR(1, 2).GetHashCode());
        }

        [TestMethod]
        public void GetHashCodeReturnsDifferentValueForDifferentStart()
        {
            DateRange dut = DR(1, 2);
            Assert.AreNotEqual(dut.GetHashCode(), DR(2, 2).GetHashCode());
        }

        [TestMethod]
        public void GetHashCodeReturnsDifferentValueForDifferentEnd()
        {
            DateRange dut = DR(1, 2);
            Assert.AreNotEqual(dut.GetHashCode(), DR(1, 3).GetHashCode());
        }

        [TestMethod]
        public void GetHashCodeReturnsDifferentValueForDifferentStartAndEnd()
        {
            DateRange dut = DR(1, 2);
            Assert.AreNotEqual(dut.GetHashCode(), DR(2, 3).GetHashCode());
        }

        [TestMethod]
        public void ToStringReturnsExpectedValue()
        {
            DateRange dut = DR(1, 2);
            Assert.AreEqual("20240101-20240102", dut.ToString());
        }

        [TestMethod]
        public void ToStringReturnsExpectedValueForSingleDay()
        {
            DateRange dut = DR(1, 1);
            Assert.AreEqual("20240101-20240101", dut.ToString());
        }

        [TestMethod]
        public void ToStringReturnsExpectedValueForMaxValue()
        {
            DateRange dut = DR(1);
            Assert.AreEqual("20240101-99991231", dut.ToString());
        }

        [TestMethod]
        public void TaggedDateRangeConstructorWithSingleValueSetsEndToMaxValue()
        {
            DateRange<char> dut = new(D(1), 'A');

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(DateOnly.MaxValue, dut.End);
            Assert.AreEqual('A', dut.Tag);
        }

        [TestMethod]
        public void TaggedDateRangeConstructorAllowsEqualValues()
        {
            DateRange<char> dut = new(D(1), D(2), 'A');

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(D(2), dut.End);
            Assert.AreEqual('A', dut.Tag);
        }

        [TestMethod]
        public void TaggedDateRangeConstructorAllowsEndAfterStart()
        {
            DateRange<char> dut = new(D(1), D(2), 'A');

            Assert.AreEqual(D(1), dut.Start);
            Assert.AreEqual(D(2), dut.End);
            Assert.AreEqual('A', dut.Tag);
        }

        [TestMethod]
        public void TaggedDateRangeConstructorForbidsStartAfterEnd()
        {
            Assert.ThrowsException<ArgumentException>(() => new DateRange<char>(D(2), D(1), 'A'));
        }

        [DataRow(1, 1, 1, true)]
        [DataRow(1, 1, 2, false)]
        [DataRow(1, 2, 1, true)]
        [DataRow(1, 2, 2, true)]
        [DataRow(1, 2, 3, false)]
        [DataRow(2, 2, 1, false)]
        [DataRow(2, 2, 2, true)]
        [DataRow(2, 4, 3, true)]
        [DataRow(2, 4, 4, true)]
        [DataRow(2, 4, 5, false)]
        [DataTestMethod]
        public void TaggedDateRangeContainsHandlesValues(int start, int end, int test, bool expected)
        {
            DateRange<char> dut = new(D(start), D(end), 'A');
            Assert.AreEqual(expected, dut.Contains(D(test)));
        }

        [TestMethod]
        public void TaggedEqualsReturnsTrueForSameValues()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsTrue(dut.Equals(DR(1, 2, 'A')));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForDifferentStart()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(DR(2, 2, 'A')));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForDifferentEnd()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(DR(1, 3, 'A')));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForDifferentStartAndEnd()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(DR(2, 3, 'A')));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForDifferentTag()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(DR(1, 2, 'B')));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForNull()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(null));
        }

        [TestMethod]
        public void TaggedEqualsReturnsFalseForDifferentType()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.IsFalse(dut.Equals(1));
        }

        [TestMethod]
        public void TaggedGetHashCodeReturnsSameValueForSameValues()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.AreEqual(dut.GetHashCode(), DR(1, 2, 'A').GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeReturnsDifferentValueForDifferentStart()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.AreNotEqual(dut.GetHashCode(), DR(2, 2, 'A').GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeReturnsDifferentValueForDifferentEnd()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.AreNotEqual(dut.GetHashCode(), DR(1, 3, 'A').GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeReturnsDifferentValueForDifferentStartAndEnd()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.AreNotEqual(dut.GetHashCode(), DR(2, 3, 'A').GetHashCode());
        }

        [TestMethod]
        public void TaggedGetHashCodeReturnsDifferentValueForDifferentTag()
        {
            DateRange<char> dut = DR(1, 2, 'A');
            Assert.AreNotEqual(dut.GetHashCode(), DR(1, 2, 'B').GetHashCode());
        }

        [TestMethod]
        public void TaggedToStringReturnsExpectedValue()
        {
            DateRange<char> dut = new(D(1), D(2), 'A');
            Assert.AreEqual("A:20240101-20240102", dut.ToString());
        }

        [TestMethod]
        public void TaggedToStringReturnsExpectedValueForSingleDay()
        {
            DateRange<char> dut = new(D(1), D(1), 'A');
            Assert.AreEqual("A:20240101-20240101", dut.ToString());
        }

        [TestMethod]
        public void TaggedToStringReturnsExpectedValueForMaxValue()
        {
            DateRange<char> dut = new(D(1), DateOnly.MaxValue, 'A');
            Assert.AreEqual("A:20240101-99991231", dut.ToString());
        }
    }
}
