using System;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.Dates;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test.PolicyEvaluationEngineTests
{
    [TestClass]
    public class ToExemptedRequirementInfoForCalculationTests
    {
        private static readonly TimeZoneInfo EasternTimeZone =
            TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

        private readonly PolicyEvaluationEngine _engine;

        public ToExemptedRequirementInfoForCalculationTests()
        {
            // Create a mock IPoliciesResource - we don't need its functionality for these tests
            var mockPoliciesResource = new Mock<IPoliciesResource>();
            _engine = new PolicyEvaluationEngine(mockPoliciesResource.Object);
        }

        private static CareTogether.Resources.ExemptedRequirementInfo CreateResourceExemption(
            string requirementName,
            DateTime? dueDate,
            DateTime? exemptionExpiresAtUtc
        )
        {
            return new CareTogether.Resources.ExemptedRequirementInfo(
                UserId: Guid.NewGuid(),
                TimestampUtc: DateTime.UtcNow,
                RequirementName: requirementName,
                DueDate: dueDate,
                AdditionalComments: "",
                ExemptionExpiresAtUtc: exemptionExpiresAtUtc
            );
        }

        /// <summary>
        /// This test validates the bug fix for the exemption due date conversion.
        /// 
        /// The bug: When a user exempts a monitoring requirement with a specific due date (e.g., 1/2/2026),
        /// the frontend sends the date as a DateTime with midnight UTC (2026-01-02T00:00:00Z).
        /// The old code incorrectly applied timezone conversion, which would shift this to 2026-01-01
        /// in Eastern time (UTC-5), causing the exemption not to match the calculated due date.
        /// 
        /// The fix: DueDate is a calendar date, not a timestamp, so we extract the date directly
        /// without timezone conversion.
        /// </summary>
        [TestMethod]
        public void DueDate_ShouldNotBeShiftedByTimezoneConversion()
        {
            // Arrange: Create an exemption with DueDate = Jan 2, 2026 at midnight UTC
            // This simulates what the frontend sends when the user selects "January 2, 2026"
            var resourceExemption = CreateResourceExemption(
                "Family Coach Safety Visit",
                dueDate: new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
                exemptionExpiresAtUtc: null
            );

            // Act: Convert to the calculation-level type
            var result = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                EasternTimeZone
            );

            // Assert: The DueDate should be January 2nd, NOT January 1st
            // The old buggy code would return January 1st because it incorrectly
            // applied timezone conversion (UTC to Eastern = -5 hours, shifting midnight to previous day)
            Assert.AreEqual(new DateOnly(2026, 1, 2), result.DueDate);
        }

        [TestMethod]
        public void DueDate_WhenNull_ShouldRemainNull()
        {
            var resourceExemption = CreateResourceExemption(
                "Family Coach Safety Visit",
                dueDate: null,
                exemptionExpiresAtUtc: null
            );

            var result = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                EasternTimeZone
            );

            Assert.IsNull(result.DueDate);
        }

        [TestMethod]
        public void RequirementName_ShouldBePreserved()
        {
            var resourceExemption = CreateResourceExemption(
                "Family Coach Safety Visit",
                dueDate: new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
                exemptionExpiresAtUtc: null
            );

            var result = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                EasternTimeZone
            );

            Assert.AreEqual("Family Coach Safety Visit", result.RequirementName);
        }

        [TestMethod]
        public void ExemptionExpiresAt_ShouldBeConvertedWithTimezone()
        {
            // ExemptionExpiresAtUtc IS a UTC timestamp and should be converted
            var resourceExemption = CreateResourceExemption(
                "Family Coach Safety Visit",
                dueDate: new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
                // This is 2026-01-15 at midnight UTC, which is 2026-01-14 at 7pm Eastern
                // So the date should be January 14th
                exemptionExpiresAtUtc: new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)
            );

            var result = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                EasternTimeZone
            );

            // The expiration timestamp is correctly converted with timezone
            Assert.AreEqual(new DateOnly(2026, 1, 14), result.ExemptionExpiresAt);
        }

        [TestMethod]
        public void DueDate_WithDifferentTimezones_ShouldAlwaysReturnSameDate()
        {
            // No matter what timezone is used, the DueDate should always be the same
            // because it's a calendar date, not a timestamp
            var resourceExemption = CreateResourceExemption(
                "Test Requirement",
                dueDate: new DateTime(2026, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                exemptionExpiresAtUtc: null
            );

            var pacificTime = TimeZoneInfo.FindSystemTimeZoneById("America/Los_Angeles");
            var tokyoTime = TimeZoneInfo.FindSystemTimeZoneById("Asia/Tokyo");

            var resultEastern = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                EasternTimeZone
            );
            var resultPacific = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                pacificTime
            );
            var resultTokyo = _engine.ToExemptedRequirementInfoForCalculation(
                resourceExemption,
                tokyoTime
            );

            // All should be March 15th regardless of timezone
            Assert.AreEqual(new DateOnly(2026, 3, 15), resultEastern.DueDate);
            Assert.AreEqual(new DateOnly(2026, 3, 15), resultPacific.DueDate);
            Assert.AreEqual(new DateOnly(2026, 3, 15), resultTokyo.DueDate);
        }
    }
}
