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
