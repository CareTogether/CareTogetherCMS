using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using System;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class FamilyApprovalCalculations
    {
        internal static ImmutableDictionary<string, FamilyRoleApprovalStatus>
            CalculateAllFamilyRoleApprovalStatuses(
            ImmutableDictionary<string, VolunteerFamilyRolePolicy> volunteerFamilyRoles,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals)
        {
            var allFamilyRoleApprovals = volunteerFamilyRoles
                .ToImmutableDictionary(
                    rolePolicy => rolePolicy.Key,
                    rolePolicy => CalculateFamilyRoleApprovalStatus(
                        rolePolicy.Key, rolePolicy.Value,
                        family,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        familyRoleRemovals.Where(role => role.RoleName == rolePolicy.Key).ToImmutableList(),
                        completedIndividualRequirements, exemptedIndividualRequirements,
                        individualRoleRemovals));

            return allFamilyRoleApprovals;
        }

        internal static FamilyRoleApprovalStatus
            CalculateFamilyRoleApprovalStatus(
            string roleName, VolunteerFamilyRolePolicy rolePolicy, Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> removalsOfThisRole,
            ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals)
        {
            var roleVersionApprovals = rolePolicy.PolicyVersions
                .Select(policyVersion =>
                    CalculateFamilyRoleVersionApprovalStatus(
                        roleName, policyVersion, family,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        removalsOfThisRole,
                        completedIndividualRequirements, exemptedIndividualRequirements,
                        individualRoleRemovals))
                .ToImmutableList();

            var effectiveRoleApprovalStatus =
                SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                    roleVersionApprovals
                        .Select(rva => rva.Status).ToImmutableList());

            return new FamilyRoleApprovalStatus(
                effectiveRoleApprovalStatus, roleVersionApprovals);
        }

        internal static FamilyRoleVersionApprovalStatus
            CalculateFamilyRoleVersionApprovalStatus(
            string roleName, VolunteerFamilyRolePolicyVersion policyVersion,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> removalsOfThisRole,
            ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals)
        {
            // Ignore any inactive (i.e., soft-deleted) adults.
            var activeAdults = family.Adults
                .Where(a => a.Item1.Active)
                .Select(a =>
                {
                    var (person, _) = a;
                    var completedRequirements =
                        completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    var exemptedRequirements =
                        exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    return (a.Item1.Id,
                        CompletedRequirements: completedRequirements,
                        ExemptedRequirements: exemptedRequirements);
                })
                .ToImmutableList();

            // For each requirement of the policy version for this role,
            // find the dates for which it was met or exempted. If there
            // are none, the resulting timeline will be 'null'.
            var requirementCompletions = policyVersion.Requirements
                .Select(requirement =>
                    CalculateFamilyRoleRequirementCompletionStatus(roleName,
                        requirement.ActionName, requirement.Stage,
                        requirement.Scope, policyVersion.SupersededAtUtc,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        individualRoleRemovals, activeAdults))
                .ToImmutableList();

            // Calculate the combined approval status timeline for this
            // role under this policy version.
            var roleVersionApprovalStatus =
                SharedCalculations.CalculateRoleVersionApprovalStatus(
                    requirementCompletions
                        .Select(x => (x.Stage, x.WhenMet)).ToImmutableList(),
                    removalsOfThisRole);

            return new FamilyRoleVersionApprovalStatus(
                policyVersion.Version, roleVersionApprovalStatus,
                requirementCompletions);
        }

        internal static FamilyRoleRequirementCompletionStatus
            CalculateFamilyRoleRequirementCompletionStatus(
            string roleName, string requirementActionName,
            RequirementStage requirementStage, VolunteerFamilyRequirementScope requirementScope,
            DateTime? policyVersionSupersededAtUtc,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals,
            ImmutableList<(Guid Id, ImmutableList<Resources.CompletedRequirementInfo> CompletedRequirements,
                ImmutableList<Resources.ExemptedRequirementInfo> ExemptedRequirements)> activeAdults)
        {
            // If there are no active adults in the family, then the requirement cannot be met.
            if (activeAdults.Count == 0)
                return new FamilyRoleRequirementCompletionStatus(requirementActionName,
                    requirementStage, requirementScope, null, ImmutableList<FamilyRequirementStatusDetail>.Empty);

            var statusDetails = requirementScope switch
            {
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily => activeAdults
                    .Select(a => new FamilyRequirementStatusDetail(a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, policyVersionSupersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults
                    .Where(a =>
                        // This works for now because 1) the previous behavior was to remove or reinstate regardless
                        // of time and 2) the UI currently doesn't provide a way to back- or post-date removals.
                        // That means that the evaluation of the new removals model using these rules will mimic the
                        // previous behavior.
                        //TODO: Instead of this hackery, we should build an actual 'participating' timeline
                        //      for each adult and intersect those with the same people's requirement completions.
                        !individualRoleRemovals.TryGetValue(a.Id, out var removedRoles) ||
                        removedRoles.All(x => x.RoleName != roleName || x.EffectiveUntil != null))
                    .Select(a => new FamilyRequirementStatusDetail(a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, policyVersionSupersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.OncePerFamily => ImmutableList.Create(
                    new FamilyRequirementStatusDetail(PersonId: null,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, policyVersionSupersededAtUtc,
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
