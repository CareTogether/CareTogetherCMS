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
    internal static class FamilyApprovalCalculations
    {
        internal static ImmutableDictionary<Guid,
            (ImmutableDictionary<string, ImmutableList<IndividualRoleVersionApprovalStatus>> IndividualRoleVersionApprovals,
            ImmutableList<RemovedRole> RemovedIndividualRoles)>
            CalculateCombinedIndividualRoleStatusForFamilyMembers(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            ImmutableDictionary<string, VolunteerRolePolicy> volunteerRoles, Family family,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allAdultsVolunteerApprovalStatus = family.Adults.Select(adultFamilyEntry =>
            {
                var (person, familyRelationship) = adultFamilyEntry;

                var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var removedRoles = removedIndividualRoles.GetValueOrEmptyList(person.Id);

                var allIndividualRoleApprovals = volunteerRoles
                    .Where(rolePolicy => !removedRoles.Any(x => x.RoleName == rolePolicy.Key))
                    .Select(rolePolicy => (RoleName: rolePolicy.Key,
                        StatusByVersions: rolePolicy.Value.PolicyVersions.Select(policyVersion =>
                        {
                            var individualRoleApprovalStatus =
                                CalculateIndividualVolunteerRoleApprovalStatus(actionDefinitions,
                                    policyVersion, completedRequirements, exemptedRequirements);
                            return individualRoleApprovalStatus;
                        })
                        .ToImmutableList()))
                    .ToImmutableList();

                var volunteerApprovalStatus = (person.Id, (
                    IndividualRoleVersionApprovals: allIndividualRoleApprovals
                        .ToImmutableDictionary(
                            x => x.RoleName,
                            x => x.StatusByVersions),
                    RemovedIndividualRoles: removedRoles));

                return volunteerApprovalStatus;
            }).ToImmutableDictionary(x => x.Id, x => x.Item2);
            return allAdultsVolunteerApprovalStatus;
        }

        internal static
            (ImmutableDictionary<string, ImmutableList<FamilyRoleApprovalStatus>> FamilyRoleVersionApprovals,
            ImmutableList<RemovedRole> RemovedFamilyRoles)
            CalculateCombinedFamilyRoleStatusForFamily(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            VolunteerPolicy volunteerPolicy, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allFamilyRoleApprovals = volunteerPolicy.VolunteerFamilyRoles
                .Where(rolePolicy => !removedFamilyRoles.Any(x => x.RoleName == rolePolicy.Key))
                .Select(rolePolicy => (RoleName: rolePolicy.Key,
                    StatusByVersions: rolePolicy.Value.PolicyVersions.Select(policyVersion =>
                    {
                        var familyRoleApprovalStatus =
                            CalculateFamilyVolunteerRoleApprovalStatus(
                                rolePolicy.Key, actionDefinitions, policyVersion, family,
                                completedFamilyRequirements, exemptedFamilyRequirements,
                                completedIndividualRequirements, exemptedIndividualRequirements,
                                removedIndividualRoles);
                        return familyRoleApprovalStatus;
                    })
                    .ToImmutableList()))
                .ToImmutableList();

            var volunteerFamilyApprovalStatus = (
                FamilyRoleVersionApprovals: allFamilyRoleApprovals
                    .ToImmutableDictionary(
                        x => x.RoleName,
                        x => x.StatusByVersions),
                RemovedFamilyRoles: removedFamilyRoles);

            return volunteerFamilyApprovalStatus;
        }

        internal static IndividualRoleVersionApprovalStatus CalculateIndividualVolunteerRoleApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions, VolunteerRolePolicyVersion policyVersion,
            ImmutableList<CompletedRequirementInfo> completedRequirements, ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            // For each requirement of the policy version for this role, find the dates for which it was met or exempted.
            // If there are none, the resulting timeline will be 'null'.
            var requirementCompletionStatus = policyVersion.Requirements.Select(requirement =>
            {
                var actionDefinition = actionDefinitions[requirement.ActionName];
                return new IndividualRoleRequirementCompletionStatus(requirement.ActionName, requirement.Stage, WhenMet:
                    SharedCalculations.FindRequirementApprovals(requirement.ActionName, actionDefinition.Validity,
                        policyVersion.SupersededAtUtc, completedRequirements, exemptedRequirements));
            }).ToImmutableList();

            // Calculate the combined approval status timeline for this role based on this policy version.
            var roleApprovalStatus = CalculateRoleApprovalStatusesFromRequirementCompletions(requirementCompletionStatus
                .Select(x => (x.Stage, x.WhenMet)).ToImmutableList());

            return new(policyVersion.Version, roleApprovalStatus, requirementCompletionStatus);
        }

        internal static
            FamilyRoleApprovalStatus
            CalculateFamilyVolunteerRoleApprovalStatus(
            string roleName, ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            VolunteerFamilyRolePolicyVersion policyVersion, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements, ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            // Ignore any inactive (i.e., soft-deleted) adults.
            var activeAdults = family.Adults
                .Where(a => a.Item1.Active)
                .Select(a =>
                {
                    var (person, _) = a;
                    var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    return (a.Item1.Id, CompletedRequirements: completedRequirements, ExemptedRequirements: exemptedRequirements);
                })
                .ToImmutableList();

            var requirementCompletions = policyVersion.Requirements
                .Select(requirement =>
                    FamilyRequirementMetOrExempted(roleName, requirement.ActionName, requirement.Stage,
                        actionDefinitions[requirement.ActionName].Validity, requirement.Scope, policyVersion.SupersededAtUtc,
                        completedFamilyRequirements, exemptedFamilyRequirements, removedIndividualRoles,
                        activeAdults))
                .ToImmutableList();

            var roleApprovalStatus = CalculateRoleApprovalStatusesFromRequirementCompletions(
                requirementCompletions.Select(x => (x.Stage, x.WhenMet)).ToImmutableList());

            return new FamilyRoleApprovalStatus(policyVersion.Version, roleApprovalStatus, requirementCompletions);
        }

        internal static DateOnlyTimeline<RoleApprovalStatus> CalculateRoleApprovalStatusesFromRequirementCompletions(
            ImmutableList<(RequirementStage Stage, DateOnlyTimeline? WhenMet)> requirementCompletionStatus)
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
            var result = new DateOnlyTimeline<RoleApprovalStatus>(taggedRanges);

            return result;
        }

        internal static FamilyRoleRequirementCompletionStatus FamilyRequirementMetOrExempted(string roleName,
            string requirementActionName, RequirementStage requirementStage, TimeSpan? actionValidity,
            VolunteerFamilyRequirementScope requirementScope,
            DateTime? supersededAtUtc,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles,
            ImmutableList<(Guid Id, ImmutableList<CompletedRequirementInfo> CompletedRequirements,
                ImmutableList<ExemptedRequirementInfo> ExemptedRequirements)> activeAdults)
        {
            // If there are no active adults in the family, then the requirement cannot be met.
            if (activeAdults.Count == 0)
                return new FamilyRoleRequirementCompletionStatus(requirementActionName,
                    requirementStage, requirementScope, null, ImmutableList<FamilyRequirementStatusDetail>.Empty);

            var statusDetails = requirementScope switch
            {
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults
                    .Select(a => new FamilyRequirementStatusDetail(
                        requirementActionName, requirementScope, a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, actionValidity, supersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults
                    .Where(a => !removedIndividualRoles.TryGetValue(a.Id, out var removedRoles) ||
                        removedRoles.All(x => x.RoleName != roleName))
                    .Select(a => new FamilyRequirementStatusDetail(
                        requirementActionName, requirementScope, a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, actionValidity, supersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.OncePerFamily => ImmutableList.Create(
                    new FamilyRequirementStatusDetail(
                        requirementActionName, requirementScope, PersonId: null,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, actionValidity, supersededAtUtc,
                            completedFamilyRequirements, exemptedFamilyRequirements))),
                _ => throw new NotImplementedException(
                    $"The volunteer family requirement scope '{requirementScope}' has not been implemented.")
            };

            var whenCombinedRequirementsAreMet = DateOnlyTimeline.IntersectionOf(
                statusDetails.Select(sd => sd.WhenMet).ToImmutableList());

            return new FamilyRoleRequirementCompletionStatus(requirementActionName,
                requirementStage, requirementScope,
                WhenMet: whenCombinedRequirementsAreMet,
                StatusDetails: statusDetails);
        }
    }
}
