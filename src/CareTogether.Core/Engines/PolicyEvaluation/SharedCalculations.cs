using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class SharedCalculations
    {
        public sealed record RequirementCheckResult(bool IsMetOrExempted, DateTime? ExpiresAtUtc);

        internal static RequirementCheckResult RequirementMetOrExempted(string requirementName,
            DateTime? policySupersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfoWithExpiration> completedRequirementsWithExpiration,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var bestCompletion = completedRequirementsWithExpiration
                .Where(completed =>
                    completed.RequirementName == requirementName &&
                    (policySupersededAtUtc == null || completed.CompletedAtUtc < policySupersededAtUtc) &&
                    completed.ExpiresAtUtc > utcNow)
                .MaxBy(completed => completed.ExpiresAtUtc ?? DateTime.MaxValue);

            if (bestCompletion != null)
                return new RequirementCheckResult(true, bestCompletion.ExpiresAtUtc);

            var bestExemption = exemptedRequirements
                .Where(exempted =>
                    exempted.RequirementName == requirementName &&
                    (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow))
                .MaxBy(exempted => exempted.ExemptionExpiresAtUtc ?? DateTime.MaxValue);

            if (bestExemption != null)
                return new RequirementCheckResult(true, bestExemption.ExemptionExpiresAtUtc);

            return new RequirementCheckResult(false, null);
        }

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
