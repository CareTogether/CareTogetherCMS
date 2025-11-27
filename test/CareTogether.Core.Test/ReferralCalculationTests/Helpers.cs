using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;

namespace CareTogether.Core.Test.V1CaseCalculationTests
{
    internal class Helpers
    {
        public static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        public const int YEAR = 2024;
        public static TimeZoneInfo US_EASTERN_TIME_ZONE = TimeZoneInfo.FindSystemTimeZoneById(
            "America/New_York"
        );

        public static ImmutableList<Engines.PolicyEvaluation.CompletedRequirementInfo> Completed(
            params (string, int)[] completionsWithDates
        ) =>
            completionsWithDates
                .Select(completion => new Engines.PolicyEvaluation.CompletedRequirementInfo(
                    completion.Item1,
                    new DateOnly(YEAR, 1, completion.Item2),
                    ExpiresAt: null
                ))
                .ToImmutableList();

        public static ImmutableList<Engines.PolicyEvaluation.CompletedRequirementInfo> CompletedWithExpiry(
            params (string, int, int?)[] completionsWithDates
        ) =>
            completionsWithDates
                .Select(completion => new Engines.PolicyEvaluation.CompletedRequirementInfo(
                    completion.Item1,
                    new DateOnly(YEAR, 1, completion.Item2),
                    ExpiresAt: completion.Item3.HasValue
                        ? new DateOnly(YEAR, 1, completion.Item3.Value)
                        : null
                ))
                .ToImmutableList();

        public static ImmutableList<Engines.PolicyEvaluation.ExemptedRequirementInfo> Exempted(
            params (string, int?)[] exemptionsWithExpirations
        ) =>
            exemptionsWithExpirations
                .Select(exemption => new Engines.PolicyEvaluation.ExemptedRequirementInfo(
                    exemption.Item1,
                    DueDate: null,
                    exemption.Item2.HasValue ? new DateOnly(YEAR, 1, exemption.Item2.Value) : null
                ))
                .ToImmutableList();

        public static ImmutableList<string> From(params string[] values) =>
            values.ToImmutableList();

        public static ImmutableList<DateTime> DateTimes() => ImmutableList<DateTime>.Empty;

        public static ImmutableList<DateTime> DateTimes(params (int month, int day)[] values) =>
            values.Select(value => new DateTime(YEAR, value.month, value.day)).ToImmutableList();

        public static ImmutableList<DateOnly> Dates(params (int month, int day)[] values) =>
            DateTimes(values).Select(DateOnly.FromDateTime).ToImmutableList();

        public static ImmutableList<DateTime> DateTimes(
            params (int month, int day, int hour)[] values
        ) =>
            values
                .Select(value => new DateTime(YEAR, value.month, value.day, value.hour, 0, 0))
                .ToImmutableList();

        public static DateTime DateTime(int month, int day) => new DateTime(YEAR, month, day);

        public static DateOnly Date(int month, int day) =>
            DateOnly.FromDateTime(DateTime(month, day));

        public static ImmutableSortedSet<ChildLocationHistoryEntry> LocationHistoryEntries(
            params (Guid childLocationFamilyId, ChildLocationPlan plan, int month, int day)[] values
        ) =>
            values
                .Select(value => new ChildLocationHistoryEntry(
                    Guid.Empty,
                    new DateTime(YEAR, value.month, value.day),
                    value.childLocationFamilyId,
                    Guid.Empty,
                    value.plan,
                    null
                ))
                .ToImmutableSortedSet();

        public static ImmutableList<ChildLocation> ChildLocationHistory(
            params (Guid childLocationFamilyId, ChildLocationPlan plan, int month, int day)[] values
        ) =>
            values
                .Select(value => new ChildLocation(
                    value.childLocationFamilyId,
                    DateOnly.FromDateTime(DateTime(value.month, value.day)),
                    value.plan == ChildLocationPlan.WithParent
                ))
                .ToImmutableList();

        public static ArrangementFunction FunctionWithoutEligibility(
            string arrangementFunction,
            FunctionRequirement requirement
        ) =>
            new ArrangementFunction(
                arrangementFunction,
                requirement,
                ImmutableList<string>.Empty,
                ImmutableList<string>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<ArrangementFunctionVariant>.Empty
            );
    }
}
