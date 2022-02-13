using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    internal class Helpers
    {
        public static ImmutableList<CompletedRequirementInfo> Completed(params (string, int)[] completionsWithDates) =>
            completionsWithDates.Select(completion =>
                new CompletedRequirementInfo(Guid.Empty, DateTime.MinValue,
                    Guid.Empty, completion.Item1, new DateTime(2022, 1, completion.Item2), null))
            .ToImmutableList();

        public static ImmutableList<string> From(params string[] values) =>
            values.ToImmutableList();

        public static ImmutableList<DateTime> Dates(params (int month, int day)[] values) =>
            values.Select(value => new DateTime(2022, value.month, value.day)).ToImmutableList();

        public static ArrangementFunction FunctionWithoutEligibility(
            string arrangementFunction, FunctionRequirement requirement) =>
            new ArrangementFunction(arrangementFunction, requirement,
                ImmutableList<string>.Empty, ImmutableList<string>.Empty,
                ImmutableList<Guid>.Empty);
    }
}
