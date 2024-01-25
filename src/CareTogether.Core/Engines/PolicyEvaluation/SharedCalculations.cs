using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class SharedCalculations
    {
        public sealed record RequirementCheckResult(bool IsMetOrExempted, DateTime? ExpiresAtUtc);

        //NOTE: This is currently being used by Referral calculations.
        internal static RequirementCheckResult RequirementMetOrExempted(string requirementName,
            DateTime? policySupersededAtUtc, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var bestCompletion = completedRequirements
                .Where(completed =>
                    completed.RequirementName == requirementName &&
                    (policySupersededAtUtc == null || completed.CompletedAtUtc < policySupersededAtUtc) &&
                    (completed.ExpiresAtUtc == null || completed.ExpiresAtUtc > utcNow))
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

        //NOTE: This is currently being used by Approval calculations.
        //      The two major differences are the removal of the utcNow parameter and the
        //      change of the return type to a Timeline. That allows returning all times when
        //      the requirement was met or exempted, not just the current one.
        //      The reason for this is to subsequently be able to determine if a role
        //      approval *was* met or exempted, even if it is now expired.
        //      A return value of 'null' indicates no approval.
        //      Further note: action validity was previously not being handled but now is.
        //TODO: Eventually this should be used for referral calculations as well!
        //      Maybe rename it to 'FindWhenRequirementIsMet' or something like that?
        internal static DateOnlyTimeline? FindRequirementApprovals(
            string requirementName, DateTime? policyVersionSupersededAtUtc,
            ImmutableList<CompletedRequirementInfo> completedRequirementsInScope,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirementsInScope)
        {
            // Policy supersedence means that, as of the 'SupersededAtUtc' date, the policy version is no longer in effect.
            // As a result, while approvals granted under that policy version continue to be valid, any requirements that
            // were completed or exempted *on or after* that date cannot be taken into account for the purposes of determining
            // role approval status under this policy version.

            var matchingCompletions = completedRequirementsInScope
                .Where(completed => completed.RequirementName == requirementName &&
                    (policyVersionSupersededAtUtc == null || completed.CompletedAtUtc < policyVersionSupersededAtUtc))
                .Select(completed => new DateRange(
                    DateOnly.FromDateTime(completed.CompletedAtUtc),
                    completed.ExpiresAtUtc == null
                        ? DateOnly.MaxValue
                        : DateOnly.FromDateTime(completed.ExpiresAtUtc.Value)))
                .ToImmutableList();

            var matchingExemptions = exemptedRequirementsInScope
                .Where(exempted => exempted.RequirementName == requirementName)
                //TODO: Exemptions currently cannot be backdated, which may need to change in order to
                //      fully support handling policy exemptions correctly within the supersedence constraint.
                //      && (policyVersionSupersededAtUtc == null || exempted.TimestampUtc < policyVersionSupersededAtUtc))
                .Select(exempted => new DateRange(
                    //NOTE: This limits exemptions to being valid as of the time they were created.
                    //      If we want to allow backdating or postdating exemptions, we'll need to change this.
                    DateOnly.FromDateTime(exempted.TimestampUtc),
                    exempted.ExemptionExpiresAtUtc == null
                        ? DateOnly.MaxValue
                        : DateOnly.FromDateTime(exempted.ExemptionExpiresAtUtc.Value)))
                .ToImmutableList();

            return DateOnlyTimeline.UnionOf(matchingCompletions.Concat(matchingExemptions).ToImmutableList());
        }
    }
}
