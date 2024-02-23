using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    internal class Helpers
    {
        public const int YEAR = 2024;

        public static ImmutableList<CompletedRequirementInfo> Completed(params (string, int)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(YEAR, 1, completion.Item2), ExpiresAtUtc: null, null, null))
            .ToImmutableList();

        public static ImmutableList<CompletedRequirementInfo> CompletedWithExpiry(params (string, int, int?)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(YEAR, 1, completion.Item2),
                    ExpiresAtUtc: completion.Item3.HasValue ? new DateTime(YEAR, 1, completion.Item3.Value) : null, null, null))
            .ToImmutableList();

        public static ImmutableList<ExemptedRequirementInfo> Exempted(params (string, int?)[] exemptionsWithExpirations) =>
            exemptionsWithExpirations.Select(exemption =>
                new ExemptedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    exemption.Item1, DueDate: null, "", exemption.Item2.HasValue ? new DateTime(YEAR, 1, exemption.Item2.Value) : null))
            .ToImmutableList();

        public static ImmutableList<string> From(params string[] values) =>
            values.ToImmutableList();

        public static ImmutableList<DateTime> Dates(params (int month, int day)[] values) =>
            values.Select(value => new DateTime(YEAR, value.month, value.day)).ToImmutableList();

        public static ImmutableSortedSet<ChildLocationHistoryEntry> LocationHistoryEntries(
            params (ChildLocationPlan plan, int month, int day)[] values) =>
            values
                .Select(value => new ChildLocationHistoryEntry(
                    Guid.Empty, new DateTime(YEAR, value.month, value.day), Guid.Empty, Guid.Empty, value.plan, null))
                .ToImmutableSortedSet();

        public static ArrangementFunction FunctionWithoutEligibility(
            string arrangementFunction, FunctionRequirement requirement) =>
            new ArrangementFunction(arrangementFunction, requirement,
                ImmutableList<string>.Empty, ImmutableList<string>.Empty,
                ImmutableList<Guid>.Empty, ImmutableList<ArrangementFunctionVariant>.Empty);
    }
}
