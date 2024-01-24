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
        internal sealed record IndividualRoleApprovalStatus(string Version,
            DateOnlyTimeline<RoleApprovalStatus>? Status,
            ImmutableList<RoleRequirementCompletionStatus> RoleRequirementCompletions);

        internal sealed record RoleRequirementCompletionStatus(string ActionName,
            RequirementStage Stage, DateOnlyTimeline? WhenMet);

        internal sealed record FamilyRoleApprovalStatus(string Version,
            DateOnlyTimeline<RoleApprovalStatus>? Status,
            ImmutableList<FamilyRoleRequirementCompletionStatus> RoleRequirementCompletions);

        internal sealed record FamilyRoleRequirementCompletionStatus(string ActionName,
            RequirementStage Stage, VolunteerFamilyRequirementScope Scope, DateOnlyTimeline? WhenMet,
            ImmutableList<FamilyRequirementStatusDetail> StatusDetails);

        internal sealed record FamilyRequirementStatusDetail(string RequirementActionName,
            VolunteerFamilyRequirementScope Scope, Guid? PersonId, DateOnlyTimeline? WhenMet);


        public static VolunteerFamilyApprovalStatus CalculateVolunteerFamilyApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            VolunteerPolicy volunteerPolicy, Family family, DateTime utcNow,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var individualResults = CalculateCombinedIndividualRoleStatusForFamilyMembers(
                actionDefinitions,
                volunteerPolicy.VolunteerRoles, family,
                completedIndividualRequirements, exemptedIndividualRequirements, removedIndividualRoles);

            var familyResult = CalculateCombinedFamilyRoleStatusForFamily(
                volunteerPolicy, family,
                completedFamilyRequirements, exemptedFamilyRequirements, removedFamilyRoles,
                completedIndividualRequirements, exemptedIndividualRequirements, removedIndividualRoles);

            var effectiveFamilyRoleVersionApprovals = familyResult.FamilyRoleVersionApprovals
                .Select(roleApprovals =>
                    (role: roleApprovals.Key,
                    effectiveApproval: CalculateEffectiveRoleVersionApproval(roleApprovals.Value, utcNow)))
                .Where(roleApproval => roleApproval.effectiveApproval != null)
                .ToImmutableDictionary(roleApproval => roleApproval.role, roleApproval => roleApproval.effectiveApproval!);

            return new VolunteerFamilyApprovalStatus(
                familyResult.FamilyRoleVersionApprovals,
                effectiveFamilyRoleVersionApprovals,
                familyResult.RemovedFamilyRoles,
                family.Adults.Select(adultFamilyEntry =>
                {
                    var (person, familyRelationship) = adultFamilyEntry;
                    var individualResult = individualResults.TryGetValue(person.Id, out var result)
                        ? result :
                        (IndividualRoleVersionApprovals: ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                        RemovedIndividualRoles: ImmutableList<RemovedRole>.Empty);

                    var mergedMissingIndividualRequirements = individualResult.MissingIndividualRequirements
                        .Concat(familyResult.MissingIndividualRequirementsForFamilyRoles.TryGetValue(person.Id, out var missing)
                            ? missing : ImmutableList<string>.Empty)
                        .Distinct()
                        .ToImmutableList();

                    var effectiveIndividualRoleVersionApprovals = individualResult.IndividualRoleVersionApprovals
                        .Select(roleApprovals =>
                            (role: roleApprovals.Key,
                            effectiveApproval: CalculateEffectiveRoleVersionApproval(roleApprovals.Value, utcNow)))
                        .Where(roleApproval => roleApproval.effectiveApproval != null)
                        .ToImmutableDictionary(roleApproval => roleApproval.role, roleApproval => roleApproval.effectiveApproval!);

                    return new KeyValuePair<Guid, VolunteerApprovalStatus>(person.Id, new VolunteerApprovalStatus(
                        IndividualRoleApprovals: individualResult.IndividualRoleVersionApprovals,
                        EffectiveIndividualRoleApprovals: effectiveIndividualRoleVersionApprovals,
                        RemovedIndividualRoles: individualResult.RemovedIndividualRoles));
                }).ToImmutableDictionary());
        }

        /// <summary>
        /// Given potentially multiple calculated role version approvals (due to having multiple policies or
        /// perhaps multiple ways that the approval was qualified for), select the one that gives the best
        /// (most-approved) status for the overall role, since that will always be the one of interest.
        /// </summary>
        internal static RoleVersionApproval? CalculateEffectiveRoleVersionApproval(
            ImmutableList<RoleVersionApproval> roleVersionApprovals, DateTime utcNow)
        {
            if (roleVersionApprovals.Count == 0)
                return null;

            // Based on the current timestamp, treat any expired approvals (approved or onboarded status) as expired.
            // (Note that the raw calculations which serve as inputs for this method don't ever return 'expired' themselves.)
            // Then, sort the status values by the numeric value of the ApprovalStatus enum cases.
            // This means that Onboarded trumps Approved, which trumps Expired, which trumps Prospective.
            // Within each status level, return the expiration date that is furthest in the future.
            var bestCurrentApproval = roleVersionApprovals
                //TODO: Is there a more straightforward way to treat a Prospective status that has expired?
                .Select(rva => rva.ApprovalStatus > RoleApprovalStatus.Expired && rva.ExpiresAt != null && rva.ExpiresAt < utcNow
                    ? rva with { ApprovalStatus = RoleApprovalStatus.Expired }
                    : rva)
                .OrderByDescending(rva => rva.ApprovalStatus)
                .ThenByDescending(rva => rva.ExpiresAt ?? DateTime.MaxValue)
                .First();

            return bestCurrentApproval;
        }

        internal static ImmutableDictionary<Guid,
            (ImmutableDictionary<string, ImmutableList<RoleVersionApproval2>> IndividualRoleVersionApprovals,
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
                            x => x.StatusByVersions
                                .Select(y => new RoleVersionApproval2(
                                    y.Version, y.Status, y.RoleRequirementCompletions
                                        .Select(z => new RoleRequirementStatus(
                                            z.ActionName, z.Stage, z.WhenMet))
                                        .ToImmutableList()))
                                .ToImmutableList()),
                    RemovedIndividualRoles: removedRoles));

                return volunteerApprovalStatus;
            }).ToImmutableDictionary(x => x.Id, x => x.Item2);
            return allAdultsVolunteerApprovalStatus;
        }

        internal static
            (ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleVersionApprovals,
            ImmutableList<RemovedRole> RemovedFamilyRoles)
            CalculateCombinedFamilyRoleStatusForFamily(
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
                        var (Status, ExpiresAtUtc, MissingRequirements, AvailableApplications, MissingIndividualRequirements) =
                            CalculateFamilyVolunteerRoleApprovalStatus(
                                rolePolicy.Key, policyVersion, family,
                                completedFamilyRequirements, exemptedFamilyRequirements,
                                completedIndividualRequirements, exemptedIndividualRequirements,
                                removedIndividualRoles);
                        return (PolicyVersion: policyVersion, Status, ExpiresAtUtc, MissingRequirements, AvailableApplications, MissingIndividualRequirements);
                    })
                    .ToImmutableList()))
                .ToImmutableList();

            var volunteerFamilyApprovalStatus = (
                FamilyRoleVersionApprovals: allFamilyRoleApprovals
                    .Where(x => x.StatusByVersions.Any(y => y.Status.HasValue))
                    .ToImmutableDictionary(
                        x => x.RoleName,
                        x => x.StatusByVersions
                            .Where(y => y.Status.HasValue)
                            .Select(y => new RoleVersionApproval(y.PolicyVersion.Version, y.Status!.Value, y.ExpiresAtUtc))
                            .ToImmutableList()),
                RemovedFamilyRoles: removedFamilyRoles);

            return volunteerFamilyApprovalStatus;
        }

        internal static IndividualRoleApprovalStatus CalculateIndividualVolunteerRoleApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions, VolunteerRolePolicyVersion policyVersion,
            ImmutableList<CompletedRequirementInfo> completedRequirements, ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            // For each requirement of the policy version for this role, find the dates for which it was met or exempted.
            // If there are none, the resulting timeline will be 'null'.
            var requirementCompletionStatus = policyVersion.Requirements.Select(requirement =>
            {
                var actionDefinition = actionDefinitions[requirement.ActionName];
                return new RoleRequirementCompletionStatus(requirement.ActionName, requirement.Stage, WhenMet:
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
            // Instead of a single status and an expiration, return a set of *each* RoleApprovalStatus and DateOnlyTimeline?
            // so that the caller gets a full picture of the role's approval history.

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
