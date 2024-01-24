using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class ApprovalCalculations
    {
        public static FamilyApprovalStatus CalculateFamilyApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            VolunteerPolicy volunteerPolicy, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allAdultsIndividualApprovalStatus = family.Adults
                .Select(adultFamilyEntry =>
                {
                    var (person, familyRelationship) = adultFamilyEntry;

                    var completedRequirements = completedIndividualRequirements
                        .GetValueOrEmptyList(person.Id);
                    var exemptedRequirements = exemptedIndividualRequirements
                        .GetValueOrEmptyList(person.Id);
                    var removedRoles = removedIndividualRoles
                        .GetValueOrEmptyList(person.Id);

                    var individualApprovalStatus =
                        IndividualApprovalCalculations.CalculateIndividualApprovalStatus(
                            actionDefinitions, volunteerPolicy.VolunteerRoles,
                            completedRequirements, exemptedRequirements, removedRoles);

                    return (person.Id, individualApprovalStatus);
                })
                .ToImmutableDictionary(x => x.Id, x => x.Item2);

            var familyRoleApprovalStatuses =
                FamilyApprovalCalculations.CalculateAllFamilyRoleApprovalStatuses(
                    actionDefinitions, volunteerPolicy.VolunteerFamilyRoles,
                    family,
                    completedFamilyRequirements, exemptedFamilyRequirements,
                    removedFamilyRoles,
                    completedIndividualRequirements, exemptedIndividualRequirements,
                    removedIndividualRoles);

            return new FamilyApprovalStatus(
                allAdultsIndividualApprovalStatus,
                familyRoleApprovalStatuses);
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
        /// </summary>
        internal static DateOnlyTimeline<RoleApprovalStatus>?
            CalculateEffectiveRoleApprovalStatus(
            ImmutableList<DateOnlyTimeline<RoleApprovalStatus>?> roleVersionApprovals)
        {
            if (roleVersionApprovals.Count == 0)
                return null;

            DateOnlyTimeline? AllRangesWith(
                RoleApprovalStatus value)
            {
                var matchingRanges = roleVersionApprovals
                    .SelectMany(rva => rva?.Ranges
                        .Where(range => range.Tag == value)
                        .Select(range => new DateRange(range.Start, range.End))
                        ?? ImmutableList<DateRange>.Empty)
                    .ToImmutableList();

                return DateOnlyTimeline.UnionOf(matchingRanges);
            }

            var allOnboarded = AllRangesWith(RoleApprovalStatus.Onboarded);
            var allApproved = AllRangesWith(RoleApprovalStatus.Approved);
            var allExpired = AllRangesWith(RoleApprovalStatus.Expired);
            var allProspective = AllRangesWith(RoleApprovalStatus.Prospective);

            // Now evaluate the impact of role approval status precedence.
            //TODO: Handle this logic generically via IComparable<T> as a
            //      method directly on DateOnlyTimeline<T>?
            var onboarded = allOnboarded;
            var approved = allApproved
                ?.Difference(onboarded);
            var expired = allExpired
                ?.Difference(approved)
                ?.Difference(onboarded);
            var prospective = allProspective
                ?.Difference(expired)
                ?.Difference(approved)
                ?.Difference(onboarded);

            // Merge the results (onboarded, approved, expired, prospective) into a tagged timeline.
            var taggedRanges = ImmutableList.Create(
                (RoleApprovalStatus.Onboarded, onboarded),
                (RoleApprovalStatus.Approved, approved),
                (RoleApprovalStatus.Expired, expired),
                (RoleApprovalStatus.Prospective, prospective)
            ).SelectMany(x => x.Item2?.Ranges
                .Select(y => new DateRange<RoleApprovalStatus>(y.Start, y.End, x.Item1))
                ?? ImmutableList<DateRange<RoleApprovalStatus>>.Empty)
            .ToImmutableList();

            var result = taggedRanges.Count > 0
                ? new DateOnlyTimeline<RoleApprovalStatus>(taggedRanges)
                : null;

            return result;
        }

        internal static DateOnlyTimeline<RoleApprovalStatus>?
            CalculateRoleVersionApprovalStatus(
            ImmutableList<(RequirementStage Stage, DateOnlyTimeline? WhenMet)>
                requirementCompletionStatus)
        {
            // Instead of a single status and an expiration, return a tagged timeline with
            // *every* date range for each effective RoleApprovalStatus, so that the
            // caller gets a full picture of the role's approval history.

            static DateOnlyTimeline? FindRangesWhereAllAreSatisfied(
                IEnumerable<(RequirementStage Stage, DateOnlyTimeline? WhenMet)> values)
            {
                return DateOnlyTimeline.IntersectionOf(
                    values.Select(value => value.WhenMet).ToImmutableList());
            }

            var onboarded = FindRangesWhereAllAreSatisfied(requirementCompletionStatus);

            var approvedOrOnboarded = FindRangesWhereAllAreSatisfied(requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application || x.Stage == RequirementStage.Approval));

            // Approved-only is the difference of approvedOrOnboarded and onboarded.
            var approvedOnly = approvedOrOnboarded?.Difference(onboarded);

            // Expired is a special case. It starts *after* any ranges from 'approvedOrOnboarded' (so it's the
            // forward-only complement of 'approvedOrOnboarded'), and ends at the end of time. If there are no
            // ranges from 'approvedOrOnboarded', then it is null.
            var expired = approvedOrOnboarded?.ForwardOnlyComplement();

            var prospectiveOrExpiredOrApprovedOrOnboarded = FindRangesWhereAllAreSatisfied(requirementCompletionStatus
                .Where(x => x.Stage == RequirementStage.Application));

            // Prospective-only is the difference of prospectiveOrExpiredOrApprovedOrOnboarded and approvedOrOnboarded,
            // subsequently also subtracting out 'expired'.
            var prospectiveOnly = prospectiveOrExpiredOrApprovedOrOnboarded
                ?.Difference(approvedOrOnboarded)
                ?.Difference(expired);

            // Merge the results (onboarded, approved, expired, prospective) into a tagged timeline.
            var taggedRanges = ImmutableList.Create(
                (RoleApprovalStatus.Onboarded, onboarded),
                (RoleApprovalStatus.Approved, approvedOnly),
                (RoleApprovalStatus.Expired, expired),
                (RoleApprovalStatus.Prospective, prospectiveOnly)
            ).SelectMany(x => x.Item2?.Ranges
                .Select(y => new DateRange<RoleApprovalStatus>(y.Start, y.End, x.Item1))
                ?? ImmutableList<DateRange<RoleApprovalStatus>>.Empty)
            .ToImmutableList();

            var result = taggedRanges.Count > 0
                ? new DateOnlyTimeline<RoleApprovalStatus>(taggedRanges)
                : null;

            return result;
        }
    }
}
