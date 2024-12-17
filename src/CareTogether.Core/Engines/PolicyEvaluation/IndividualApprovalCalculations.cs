using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    static class IndividualApprovalCalculations
    {
        internal static IndividualApprovalStatus CalculateIndividualApprovalStatus(
            ImmutableDictionary<string, VolunteerRolePolicy> volunteerRoles,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RoleRemoval> roleRemovals
        )
        {
            ImmutableDictionary<string, IndividualRoleApprovalStatus> allIndividualRoleApprovals =
                volunteerRoles.ToImmutableDictionary(
                    rolePolicy => rolePolicy.Key,
                    rolePolicy =>
                        CalculateIndividualRoleApprovalStatus(
                            rolePolicy.Value,
                            completedRequirements,
                            exemptedRequirements,
                            roleRemovals.Where(x => x.RoleName == rolePolicy.Key).ToImmutableList()
                        )
                );

            return new IndividualApprovalStatus(allIndividualRoleApprovals);
        }

        internal static IndividualRoleApprovalStatus CalculateIndividualRoleApprovalStatus(
            VolunteerRolePolicy rolePolicy,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RoleRemoval> removalsOfThisRole
        )
        {
            ImmutableList<IndividualRoleVersionApprovalStatus> roleVersionApprovals = rolePolicy
                .PolicyVersions.Select(policyVersion =>
                    CalculateIndividualRoleVersionApprovalStatus(
                        policyVersion,
                        completedRequirements,
                        exemptedRequirements,
                        removalsOfThisRole
                    )
                )
                .ToImmutableList();

            DateOnlyTimeline<RoleApprovalStatus>? effectiveRoleApprovalStatus =
                SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                    roleVersionApprovals.Select(rva => rva.Status).ToImmutableList()
                );

            return new IndividualRoleApprovalStatus(effectiveRoleApprovalStatus, roleVersionApprovals);
        }

        internal static IndividualRoleVersionApprovalStatus CalculateIndividualRoleVersionApprovalStatus(
            VolunteerRolePolicyVersion policyVersion,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RoleRemoval> removalsOfThisRole
        )
        {
            // For each requirement of the policy version for this role,
            // find the dates for which it was met or exempted. If there
            // are none, the resulting timeline will be 'null'.
            ImmutableList<IndividualRoleRequirementCompletionStatus> requirementCompletionStatus = policyVersion
                .Requirements.Select(requirement =>
                    CalculateIndividualRoleRequirementCompletionStatus(
                        requirement,
                        policyVersion.SupersededAtUtc,
                        completedRequirements,
                        exemptedRequirements
                    )
                )
                .ToImmutableList();

            // Calculate the combined approval status timeline for this
            // role under this policy version.
            DateOnlyTimeline<RoleApprovalStatus>? roleVersionApprovalStatus =
                SharedCalculations.CalculateRoleVersionApprovalStatus(
                    requirementCompletionStatus.Select(x => (x.Stage, x.WhenMet)).ToImmutableList(),
                    removalsOfThisRole
                );

            return new IndividualRoleVersionApprovalStatus(
                policyVersion.Version,
                roleVersionApprovalStatus,
                requirementCompletionStatus
            );
        }

        internal static IndividualRoleRequirementCompletionStatus CalculateIndividualRoleRequirementCompletionStatus(
            VolunteerApprovalRequirement requirement,
            DateTime? policyVersionSupersededAtUtc,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements
        )
        {
            DateOnlyTimeline? whenMet = SharedCalculations.FindRequirementApprovals(
                requirement.ActionName,
                policyVersionSupersededAtUtc,
                completedRequirements,
                exemptedRequirements
            );

            return new IndividualRoleRequirementCompletionStatus(requirement.ActionName, requirement.Stage, whenMet);
        }
    }
}
