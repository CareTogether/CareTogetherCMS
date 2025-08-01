using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class SharedCalculations
    {
        public sealed record RequirementCheckResult(bool IsMetOrExempted, DateOnly? ExpiresAtUtc);

        private static KeyValuePair<string, ActionRequirement>? FindActionDefinition(
            EffectiveLocationPolicy locationPolicy,
            string requiredAction
        )
        {
            return locationPolicy
                .ActionDefinitions.ToImmutableDictionary()
                .FirstOrDefault(item =>
                    item.Key == requiredAction || item.Value.AlternateNames.Contains(requiredAction)
                );
        }

        internal static ImmutableList<string> GetRequirementNameWithSynonyms(
            EffectiveLocationPolicy locationPolicy,
            string requirementName
        )
        {
            var actionDefinition = FindActionDefinition(locationPolicy, requirementName);

            if (!actionDefinition.HasValue)
                return [requirementName];

            return ImmutableList
                .Create(actionDefinition.Value.Key)
                .AddRange(actionDefinition.Value.Value.AlternateNames ?? [])
                .ToImmutableList();
        }

        //NOTE: This is currently being used by Referral calculations.
        internal static RequirementCheckResult RequirementMetOrExempted(
            ImmutableList<string> requirementNameWithSynonyms,
            DateOnly? policySupersededAt,
            DateOnly today,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements
        )
        {
            var bestCompletion = completedRequirements
                .Where(completed =>
                    requirementNameWithSynonyms.Contains(completed.RequirementName)
                    && (policySupersededAt == null || completed.CompletedAt < policySupersededAt)
                    && (completed.ExpiresAt == null || completed.ExpiresAt > today)
                )
                .MaxBy(completed => completed.ExpiresAt ?? DateOnly.MaxValue);

            if (bestCompletion != null)
                return new RequirementCheckResult(true, bestCompletion.ExpiresAt);

            var bestExemption = exemptedRequirements
                .Where(exempted =>
                    requirementNameWithSynonyms.Contains(exempted.RequirementName)
                    && (exempted.ExemptionExpiresAt == null || exempted.ExemptionExpiresAt > today)
                )
                .MaxBy(exempted => exempted.ExemptionExpiresAt ?? DateOnly.MaxValue);

            if (bestExemption != null)
                return new RequirementCheckResult(true, bestExemption.ExemptionExpiresAt);

            return new RequirementCheckResult(false, null);
        }

        /// <summary>
        /// Given potentially multiple calculated role version approvals (due to
        /// having multiple policies or perhaps multiple ways that the approval
        /// was qualified for), merge the approval values to give a single
        /// effective approval value for the overall role.
        ///
        /// The way this method is implemented here is to provide the most
        /// "positive" approval value possible at any given time. For example,
        /// if there is a Prospective approval in one role version and an Approved
        /// approval in another version of the same role, the result is Approved.
        ///
        /// However, if there are any role removals, they will take precedence.
        /// </summary>
        internal static DateOnlyTimeline<RoleApprovalStatus>? CalculateEffectiveRoleApprovalStatus(
            ImmutableList<DateOnlyTimeline<RoleApprovalStatus>?> roleVersionApprovals
        )
        {
            if (roleVersionApprovals.Count == 0)
                return null;

            DateOnlyTimeline? AllRangesWith(RoleApprovalStatus value)
            {
                var matchingRanges = roleVersionApprovals
                    .SelectMany(rva =>
                        rva?.Ranges.Where(range => range.Tag == value)
                            .Select(range => new DateRange(range.Start, range.End))
                        ?? ImmutableList<DateRange>.Empty
                    )
                    .ToImmutableList();

                return DateOnlyTimeline.UnionOf(matchingRanges);
            }

            var allDenied = AllRangesWith(RoleApprovalStatus.Denied);
            var allInactive = AllRangesWith(RoleApprovalStatus.Inactive);
            var allRemovals = DateOnlyTimeline.UnionOf(
                ImmutableList.Create(allDenied, allInactive)
            );

            var allOnboarded = AllRangesWith(RoleApprovalStatus.Onboarded);
            var allApproved = AllRangesWith(RoleApprovalStatus.Approved);
            var allExpired = AllRangesWith(RoleApprovalStatus.Expired);
            var allProspective = AllRangesWith(RoleApprovalStatus.Prospective);

            // Now evaluate the impact of role approval status precedence.
            //TODO: Handle this logic generically via IComparable<T> as a
            //      method directly on DateOnlyTimeline<T>?
            var denied = allDenied; // Denied takes precedence over everything else
            var inactive = allInactive?.Difference(allDenied);
            var onboarded = allOnboarded?.Difference(allRemovals);
            var approved = allApproved?.Difference(onboarded)?.Difference(allRemovals);
            var expired = allExpired
                ?.Difference(approved)
                ?.Difference(onboarded)
                ?.Difference(allRemovals);
            var prospective = allProspective
                ?.Difference(expired)
                ?.Difference(approved)
                ?.Difference(onboarded)
                ?.Difference(allRemovals);

            // Merge the results (onboarded, approved, expired, prospective) into a tagged timeline.
            var taggedRanges = ImmutableList
                .Create(
                    (RoleApprovalStatus.Denied, denied),
                    (RoleApprovalStatus.Inactive, inactive),
                    (RoleApprovalStatus.Onboarded, onboarded),
                    (RoleApprovalStatus.Approved, approved),
                    (RoleApprovalStatus.Expired, expired),
                    (RoleApprovalStatus.Prospective, prospective)
                )
                .SelectMany(x =>
                    x.Item2?.Ranges.Select(y => new DateRange<RoleApprovalStatus>(
                        y.Start,
                        y.End,
                        x.Item1
                    )) ?? ImmutableList<DateRange<RoleApprovalStatus>>.Empty
                )
                .ToImmutableList();

            var result =
                taggedRanges.Count > 0
                    ? new DateOnlyTimeline<RoleApprovalStatus>(taggedRanges)
                    : null;

            return result;
        }

        internal static DateOnlyTimeline<RoleApprovalStatus>? CalculateRoleVersionApprovalStatus(
            ImmutableList<(
                RequirementStage Stage,
                DateOnlyTimeline? WhenMet
            )> requirementCompletionStatus,
            ImmutableList<RoleRemoval> removalsOfThisRole
        )
        {
            // Instead of a single status and an expiration, return a tagged timeline with
            // *every* date range for each effective RoleApprovalStatus, so that the
            // caller gets a full picture of the role's approval history.

            static DateOnlyTimeline? FindRangesWhereAllAreSatisfied(
                IEnumerable<(RequirementStage Stage, DateOnlyTimeline? WhenMet)> values
            )
            {
                return DateOnlyTimeline.IntersectionOf(
                    values.Select(value => value.WhenMet).ToImmutableList()
                );
            }

            var onboarded = FindRangesWhereAllAreSatisfied(requirementCompletionStatus);

            var approvedOrOnboarded = FindRangesWhereAllAreSatisfied(
                requirementCompletionStatus.Where(x =>
                    x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval
                )
            );

            // Approved-only is the difference of approvedOrOnboarded and onboarded.
            var approvedOnly = approvedOrOnboarded?.Difference(onboarded);

            // Expired is a special case. It starts *after* any ranges from 'approvedOrOnboarded' (so it's the
            // forward-only complement of 'approvedOrOnboarded'), and ends at the end of time. If there are no
            // ranges from 'approvedOrOnboarded', then it is null.
            var expired = approvedOrOnboarded?.ForwardOnlyComplement();

            var prospectiveOrExpiredOrApprovedOrOnboarded = FindRangesWhereAllAreSatisfied(
                requirementCompletionStatus.Where(x => x.Stage == RequirementStage.Application)
            );

            // Prospective-only is the difference of prospectiveOrExpiredOrApprovedOrOnboarded and approvedOrOnboarded,
            // subsequently also subtracting out 'expired'.
            var prospectiveOnly = prospectiveOrExpiredOrApprovedOrOnboarded
                ?.Difference(approvedOrOnboarded)
                ?.Difference(expired);

            // Calculate the timelines for removals. Note that there could be multiple overlapping removals,
            // so we need to calculate the union of all of them, by removal reason.
            var inactive = DateOnlyTimeline.UnionOf(
                removalsOfThisRole
                    .Where(removal => removal.Reason == RoleRemovalReason.Inactive)
                    .Select(removal => new DateRange(
                        removal.EffectiveSince,
                        removal.EffectiveUntil ?? DateOnly.MaxValue
                    ))
                    .ToImmutableList()
            );
            var denied = DateOnlyTimeline.UnionOf(
                removalsOfThisRole
                    .Where(removal => removal.Reason == RoleRemovalReason.Denied)
                    .Select(removal => new DateRange(
                        removal.EffectiveSince,
                        removal.EffectiveUntil ?? DateOnly.MaxValue
                    ))
                    .ToImmutableList()
            );
            var optOut = DateOnlyTimeline.UnionOf(
                removalsOfThisRole
                    .Where(removal => removal.Reason == RoleRemovalReason.OptOut)
                    .Select(removal => new DateRange(
                        removal.EffectiveSince,
                        removal.EffectiveUntil ?? DateOnly.MaxValue
                    ))
                    .ToImmutableList()
            );

            var allRemovals = DateOnlyTimeline.UnionOf(
                ImmutableList.Create(inactive, denied, optOut)
            );

            // Merge the results (onboarded, approved, expired, prospective) into a tagged timeline.
            var taggedRanges = ImmutableList
                .Create(
                    (RoleApprovalStatus.Denied, denied),
                    (RoleApprovalStatus.Inactive, inactive?.Difference(denied)), // Denied takes precedence over Inactive
                    (RoleApprovalStatus.Onboarded, onboarded?.Difference(allRemovals)),
                    (RoleApprovalStatus.Approved, approvedOnly?.Difference(allRemovals)),
                    (RoleApprovalStatus.Expired, expired?.Difference(allRemovals)),
                    (RoleApprovalStatus.Prospective, prospectiveOnly?.Difference(allRemovals))
                )
                .SelectMany(x =>
                    x.Item2?.Ranges.Select(y => new DateRange<RoleApprovalStatus>(
                        y.Start,
                        y.End,
                        x.Item1
                    )) ?? ImmutableList<DateRange<RoleApprovalStatus>>.Empty
                )
                .ToImmutableList();

            var result =
                taggedRanges.Count > 0
                    ? new DateOnlyTimeline<RoleApprovalStatus>(taggedRanges)
                    : null;

            return result;
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
            ImmutableList<string> requirementNameWithSynonyms,
            DateTime? policyVersionSupersededAtUtc,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirementsInScope,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirementsInScope
        )
        {
            // Policy supersedence means that, as of the 'SupersededAtUtc' date, the policy version is no longer in effect.
            // As a result, while approvals granted under that policy version continue to be valid, any requirements that
            // were completed or exempted *on or after* that date cannot be taken into account for the purposes of determining
            // role approval status under this policy version.

            var matchingCompletions = completedRequirementsInScope
                .Where(completed =>
                    requirementNameWithSynonyms.Contains(completed.RequirementName)
                    && (
                        policyVersionSupersededAtUtc == null
                        || completed.CompletedAtUtc.Date < policyVersionSupersededAtUtc.Value.Date
                    )
                )
                .Select(completed => new DateRange(
                    DateOnly.FromDateTime(completed.CompletedAtUtc),
                    completed.ExpiresAtUtc == null
                        ? DateOnly.MaxValue
                        : DateOnly.FromDateTime(completed.ExpiresAtUtc.Value)
                ))
                .ToImmutableList();

            var matchingExemptions = exemptedRequirementsInScope
                .Where(exempted => requirementNameWithSynonyms.Contains(exempted.RequirementName))
                //TODO: Exemptions currently cannot be backdated, which may need to change in order to
                //      fully support handling policy exemptions correctly within the supersedence constraint.
                //      && (policyVersionSupersededAtUtc == null || exempted.TimestampUtc < policyVersionSupersededAtUtc))
                //NOTE: Only include exemptions that are valid, i.e. that expired in the future at the time of exemption. Otherwise,
                //      the timeline logic will not work correctly. TODO: This will need to change once backdating is enabled.
                .Where(exempted =>
                    exempted.ExemptionExpiresAtUtc == null
                    || exempted.ExemptionExpiresAtUtc.Value >= exempted.TimestampUtc
                )
                .Select(exempted => new DateRange(
                    //NOTE: This limits exemptions to being valid as of the time they were created.
                    //      If we want to allow backdating or postdating exemptions, we'll need to change this.
                    DateOnly.FromDateTime(exempted.TimestampUtc),
                    exempted.ExemptionExpiresAtUtc == null
                        ? DateOnly.MaxValue
                        : DateOnly.FromDateTime(exempted.ExemptionExpiresAtUtc.Value)
                ))
                .ToImmutableList();

            return DateOnlyTimeline.UnionOf(
                matchingCompletions.Concat(matchingExemptions).ToImmutableList()
            );
        }
    }
}
