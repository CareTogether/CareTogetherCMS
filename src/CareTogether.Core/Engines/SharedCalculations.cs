using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines
{
    internal static class SharedCalculations
    {
        internal static bool RequirementMetOrExempted(string requirementName,
            DateTime? policySupersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements) =>
            completedRequirements.Any(completed =>
                completed.RequirementName == requirementName &&
                (policySupersededAtUtc == null || completed.CompletedAtUtc < policySupersededAtUtc)) ||
            exemptedRequirements.Any(exempted =>
                exempted.RequirementName == requirementName &&
                (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow));
    }
}
