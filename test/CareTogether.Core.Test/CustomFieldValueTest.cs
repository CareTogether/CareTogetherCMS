using System;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json.Linq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class CustomFieldValueTest
    {
        [TestMethod]
        public void DateOnlyValuesPreserveTheirCalendarDate()
        {
            var value = CustomFieldValue.Normalize(CustomFieldType.DateOnly, "2026-09-18");

            Assert.AreEqual("2026-09-18", value);
        }

        [TestMethod]
        public void DateOnlyValuesAcceptTheJsonStringPayloadUsedByTheApi()
        {
            var value = CustomFieldValue.Normalize(
                CustomFieldType.DateOnly,
                new JValue("2026-09-18")
            );

            Assert.AreEqual("2026-09-18", value);
        }

        [DataTestMethod]
        [DataRow("09/18/2026")]
        [DataRow("2026-2-18")]
        [DataRow("2026-02-30")]
        public void InvalidDateOnlyValuesAreRejected(string value)
        {
            Assert.ThrowsExactly<InvalidOperationException>(() =>
                CustomFieldValue.Normalize(CustomFieldType.DateOnly, value)
            );
        }

        [TestMethod]
        public void DateOnlyValuesCanBeCleared()
        {
            Assert.IsNull(CustomFieldValue.Normalize(CustomFieldType.DateOnly, null));
        }

        [TestMethod]
        public void DateTimeValuesAreNormalizedToUtc()
        {
            var value = CustomFieldValue.Normalize(
                CustomFieldType.DateTime,
                "2026-09-18T13:30:00-04:00"
            );

            Assert.AreEqual("2026-09-18T17:30:00.000Z", value);
        }

        [DataTestMethod]
        [DataRow("2026-09-18")]
        [DataRow("not-a-timestamp")]
        public void InvalidDateTimeValuesAreRejected(string value)
        {
            Assert.ThrowsExactly<InvalidOperationException>(() =>
                CustomFieldValue.Normalize(CustomFieldType.DateTime, value)
            );
        }

        [TestMethod]
        public void DateTimeValuesCanBeCleared()
        {
            Assert.IsNull(CustomFieldValue.Normalize(CustomFieldType.DateTime, null));
        }

        [TestMethod]
        public void ExistingCustomFieldValuesRemainUnchanged()
        {
            var selectedValues = new[] { "First", "Second" };

            Assert.AreEqual(
                true,
                CustomFieldValue.Normalize(CustomFieldType.Boolean, true)
            );
            Assert.AreEqual(
                "A value",
                CustomFieldValue.Normalize(CustomFieldType.String, "A value")
            );
            CollectionAssert.AreEqual(
                selectedValues,
                (string[])CustomFieldValue.Normalize(CustomFieldType.StringArray, selectedValues)!
            );
        }
    }
}
