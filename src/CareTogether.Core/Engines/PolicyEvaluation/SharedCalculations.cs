using CareTogether.Resources;
using CareTogether.Resources.Policies;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class SharedCalculations
    {
        internal static CompletedRequirementInfo ApplyValidityPolicyToCompletedRequirement(
            EffectiveLocationPolicy policy, CompletedRequirementInfo completed)
        {
            var actionDefinition = policy.ActionDefinitions[completed.RequirementName];
            return completed with
            {
                ExpiresAtUtc = actionDefinition.Validity.HasValue ? completed.CompletedAtUtc + actionDefinition.Validity : null
            };
        }

        public sealed record RequirementCheckResult(bool IsMetOrExempted, DateTime? ExpiresAtUtc);

        internal static RequirementCheckResult RequirementMetOrExempted(string requirementName,
            DateTime? policySupersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var bestCompletion = completedRequirements
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
    }
}
