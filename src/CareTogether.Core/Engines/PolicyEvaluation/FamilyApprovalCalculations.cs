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
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            ImmutableDictionary<string, VolunteerFamilyRolePolicy> volunteerFamilyRoles,
            Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var allFamilyRoleApprovals = volunteerFamilyRoles
                .Where(rolePolicy =>
                    !removedFamilyRoles.Any(x => x.RoleName == rolePolicy.Key))
                .ToImmutableDictionary(
                    rolePolicy => rolePolicy.Key,
                    rolePolicy => CalculateFamilyRoleApprovalStatus(
                        actionDefinitions, rolePolicy.Key, rolePolicy.Value,
                        family,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        removedFamilyRoles,
                        completedIndividualRequirements, exemptedIndividualRequirements,
                        removedIndividualRoles));

            return allFamilyRoleApprovals;
        }

        internal static FamilyRoleApprovalStatus
            CalculateFamilyRoleApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            string roleName, VolunteerFamilyRolePolicy rolePolicy, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var roleVersionApprovals = rolePolicy.PolicyVersions
                .Select(policyVersion =>
                    CalculateFamilyRoleVersionApprovalStatus(
                        actionDefinitions, roleName, policyVersion, family,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        completedIndividualRequirements, exemptedIndividualRequirements,
                        removedIndividualRoles))
                .ToImmutableList();

            var effectiveRoleApprovalStatus =
                ApprovalCalculations.CalculateEffectiveRoleApprovalStatus(
                    roleVersionApprovals
                        .Select(rva => rva.Status).ToImmutableList());

            return new FamilyRoleApprovalStatus(
                effectiveRoleApprovalStatus, roleVersionApprovals);
        }

        internal static FamilyRoleVersionApprovalStatus
            CalculateFamilyRoleVersionApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            string roleName, VolunteerFamilyRolePolicyVersion policyVersion,
            Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
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
                        actionDefinitions[requirement.ActionName].Validity,
                        requirement.Scope, policyVersion.SupersededAtUtc,
                        completedFamilyRequirements, exemptedFamilyRequirements,
                        removedIndividualRoles, activeAdults))
                .ToImmutableList();

            // Calculate the combined approval status timeline for this
            // role under this policy version.
            var roleVersionApprovalStatus =
                ApprovalCalculations.CalculateRoleVersionApprovalStatus(
                    requirementCompletions
                        .Select(x => (x.Stage, x.WhenMet)).ToImmutableList());

            return new FamilyRoleVersionApprovalStatus(
                policyVersion.Version, roleVersionApprovalStatus,
                requirementCompletions);
        }

        internal static FamilyRoleRequirementCompletionStatus
            CalculateFamilyRoleRequirementCompletionStatus(
            string roleName, string requirementActionName,
            RequirementStage requirementStage, TimeSpan? actionValidity,
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
                    .Select(a => new FamilyRequirementStatusDetail(a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, actionValidity, supersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily => activeAdults
                    .Where(a =>
                        !removedIndividualRoles.TryGetValue(a.Id, out var removedRoles) ||
                        removedRoles.All(x => x.RoleName != roleName))
                    .Select(a => new FamilyRequirementStatusDetail(a.Id,
                        SharedCalculations.FindRequirementApprovals(
                            requirementActionName, actionValidity, supersededAtUtc,
                            a.CompletedRequirements, a.ExemptedRequirements)))
                    .ToImmutableList(),
                VolunteerFamilyRequirementScope.OncePerFamily => ImmutableList.Create(
                    new FamilyRequirementStatusDetail(PersonId: null,
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
