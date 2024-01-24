using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class IndividualApprovalCalculations
    {
        internal static IndividualApprovalStatus
            CalculateIndividualApprovalStatus(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            ImmutableDictionary<string, VolunteerRolePolicy> volunteerRoles,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RemovedRole> removedRoles)
        {
            var allIndividualRoleApprovals = volunteerRoles
                .Where(rolePolicy =>
                    !removedRoles.Any(x => x.RoleName == rolePolicy.Key))
                .ToImmutableDictionary(
                    rolePolicy => rolePolicy.Key,
                    rolePolicy => CalculateIndividualRoleApprovalStatus(
                        rolePolicy.Value, actionDefinitions,
                        completedRequirements, exemptedRequirements));

            return new IndividualApprovalStatus(allIndividualRoleApprovals);
        }

        internal static IndividualRoleApprovalStatus
            CalculateIndividualRoleApprovalStatus(
                VolunteerRolePolicy rolePolicy,
                ImmutableDictionary<string, ActionRequirement> actionDefinitions,
                ImmutableList<CompletedRequirementInfo> completedRequirements,
                ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var roleVersionApprovals = rolePolicy.PolicyVersions
                .Select(policyVersion =>
                    CalculateIndividualRoleVersionApprovalStatus(
                        actionDefinitions, policyVersion,
                        completedRequirements, exemptedRequirements))
                .ToImmutableList();

            var effectiveRoleApprovalStatus =
                ApprovalCalculations.CalculateEffectiveRoleApprovalStatus(
                    roleVersionApprovals
                        .Select(rva => rva.Status).ToImmutableList());

            return new IndividualRoleApprovalStatus(
                effectiveRoleApprovalStatus, roleVersionApprovals);
        }

        internal static IndividualRoleVersionApprovalStatus
            CalculateIndividualRoleVersionApprovalStatus(
                ImmutableDictionary<string, ActionRequirement> actionDefinitions,
                VolunteerRolePolicyVersion policyVersion,
                ImmutableList<CompletedRequirementInfo> completedRequirements,
                ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            // For each requirement of the policy version for this role,
            // find the dates for which it was met or exempted. If there
            // are none, the resulting timeline will be 'null'.
            var requirementCompletionStatus = policyVersion.Requirements
                .Select(requirement =>
                    CalculateIndividualRoleRequirementCompletionStatus(
                        actionDefinitions[requirement.ActionName], requirement,
                        policyVersion.SupersededAtUtc,
                        completedRequirements, exemptedRequirements))
                .ToImmutableList();

            // Calculate the combined approval status timeline for this
            // role under this policy version.
            var roleVersionApprovalStatus =
                ApprovalCalculations.CalculateRoleVersionApprovalStatus(
                    requirementCompletionStatus
                        .Select(x => (x.Stage, x.WhenMet)).ToImmutableList());

            return new IndividualRoleVersionApprovalStatus(
                policyVersion.Version, roleVersionApprovalStatus,
                requirementCompletionStatus);
        }

        internal static IndividualRoleRequirementCompletionStatus
            CalculateIndividualRoleRequirementCompletionStatus(
                ActionRequirement actionDefinition,
                VolunteerApprovalRequirement requirement,
                DateTime? policyVersionSupersededAtUtc,
                ImmutableList<CompletedRequirementInfo> completedRequirements,
                ImmutableList<ExemptedRequirementInfo> exemptedRequirements)
        {
            var whenMet = SharedCalculations.FindRequirementApprovals(
                requirement.ActionName, actionDefinition.Validity,
                policyVersionSupersededAtUtc,
                completedRequirements, exemptedRequirements);

            return new IndividualRoleRequirementCompletionStatus(
                requirement.ActionName, requirement.Stage, whenMet);
        }
    }
}
