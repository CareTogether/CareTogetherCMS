using CareTogether.Resources;
using System;
using System.Collections.Generic;
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

        public static VolunteerFunction FunctionWithoutEligibility(
            string arrangementFunction, FunctionRequirement requirement) =>
            new VolunteerFunction(arrangementFunction, requirement,
                ImmutableList<string>.Empty, ImmutableList<string>.Empty);
    }
}
