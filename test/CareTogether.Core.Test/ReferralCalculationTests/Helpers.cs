using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    class Helpers
    {
        public const int YEAR = 2024;
        public static TimeZoneInfo US_EASTERN_TIME_ZONE = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

        public static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        public static ImmutableList<CompletedRequirementInfo> Completed(params (string, int)[] completionsWithDates)
        {
            return completionsWithDates
                .Select(completion => new CompletedRequirementInfo(
                    completion.Item1,
                    new DateOnly(YEAR, 1, completion.Item2),
                    null
                ))
                .ToImmutableList();
        }

        public static ImmutableList<CompletedRequirementInfo> CompletedWithExpiry(
            params (string, int, int?)[] completionsWithDates
        )
        {
            return completionsWithDates
                .Select(completion => new CompletedRequirementInfo(
                    completion.Item1,
                    new DateOnly(YEAR, 1, completion.Item2),
                    completion.Item3.HasValue ? new DateOnly(YEAR, 1, completion.Item3.Value) : null
                ))
                .ToImmutableList();
        }

        public static ImmutableList<ExemptedRequirementInfo> Exempted(params (string, int?)[] exemptionsWithExpirations)
        {
            return exemptionsWithExpirations
                .Select(exemption => new ExemptedRequirementInfo(
                    exemption.Item1,
                    null,
                    exemption.Item2.HasValue ? new DateOnly(YEAR, 1, exemption.Item2.Value) : null
                ))
                .ToImmutableList();
        }

        public static ImmutableList<string> From(params string[] values)
        {
            return values.ToImmutableList();
        }

        public static ImmutableList<DateTime> DateTimes()
        {
            return ImmutableList<DateTime>.Empty;
        }

        public static ImmutableList<DateTime> DateTimes(params (int month, int day)[] values)
        {
            return values.Select(value => new DateTime(YEAR, value.month, value.day)).ToImmutableList();
        }

        public static ImmutableList<DateOnly> Dates(params (int month, int day)[] values)
        {
            return DateTimes(values).Select(DateOnly.FromDateTime).ToImmutableList();
        }

        public static ImmutableList<DateTime> DateTimes(params (int month, int day, int hour)[] values)
        {
            return values
                .Select(value => new DateTime(YEAR, value.month, value.day, value.hour, 0, 0))
                .ToImmutableList();
        }

        public static DateTime DateTime(int month, int day)
        {
            return new DateTime(YEAR, month, day);
        }

        public static DateOnly Date(int month, int day)
        {
            return DateOnly.FromDateTime(DateTime(month, day));
        }

        public static ImmutableSortedSet<ChildLocationHistoryEntry> LocationHistoryEntries(
            params (Guid childLocationFamilyId, ChildLocationPlan plan, int month, int day)[] values
        )
        {
            return values
                .Select(value => new ChildLocationHistoryEntry(
                    Guid.Empty,
                    new DateTime(YEAR, value.month, value.day),
                    value.childLocationFamilyId,
                    Guid.Empty,
                    value.plan,
                    null
                ))
                .ToImmutableSortedSet();
        }

        public static ImmutableList<ChildLocation> ChildLocationHistory(
            params (Guid childLocationFamilyId, ChildLocationPlan plan, int month, int day)[] values
        )
        {
            return values
                .Select(value => new ChildLocation(
                    value.childLocationFamilyId,
                    DateOnly.FromDateTime(DateTime(value.month, value.day)),
                    value.plan == ChildLocationPlan.WithParent
                ))
                .ToImmutableList();

        public static ArrangementFunction FunctionWithoutEligibility(
            string arrangementFunction,
            FunctionRequirement requirement
        )
        {
            return new ArrangementFunction(
                arrangementFunction,
                requirement,
                ImmutableList<string>.Empty,
                ImmutableList<string>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<ArrangementFunctionVariant>.Empty
            );
        }
    }
}
