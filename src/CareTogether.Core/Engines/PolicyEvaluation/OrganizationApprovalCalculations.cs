using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.OrganizationApprovals;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class OrganizationApprovalCalculations
    {
        internal static OrganizationApprovalStatus Calculate(
            EffectiveLocationPolicy locationPolicy,
            OrganizationApprovalEntry entry
        )
        {
            var approvals = locationPolicy
                .OrganizationApprovalPolicy.OrganizationRoles.ToImmutableDictionary(
                    role => role.Key,
                    role => CalculateRole(
                        locationPolicy,
                        role.Value,
                        entry.CompletedRequirements,
                        entry.ExemptedRequirements,
                        entry.RoleRemovals
                            .Where(removal => removal.RoleName == role.Key)
                            .ToImmutableList()
                    )
                );
            return new OrganizationApprovalStatus(approvals);
        }

        private static OrganizationRoleApprovalStatus CalculateRole(
            EffectiveLocationPolicy locationPolicy,
            OrganizationRolePolicy rolePolicy,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RoleRemoval> roleRemovals
        )
        {
            var versions = rolePolicy
                .PolicyVersions.Select(version =>
                    CalculateVersion(
                        locationPolicy,
                        rolePolicy,
                        version,
                        completedRequirements,
                        exemptedRequirements,
                        roleRemovals
                    )
                )
                .ToImmutableList();
            var effectiveStatus = SharedCalculations.CalculateEffectiveRoleApprovalStatus(
                versions.Select(version => version.Status).ToImmutableList()
            );
            return new OrganizationRoleApprovalStatus(effectiveStatus, versions);
        }

        private static OrganizationRoleVersionApprovalStatus CalculateVersion(
            EffectiveLocationPolicy locationPolicy,
            OrganizationRolePolicy rolePolicy,
            OrganizationRolePolicyVersion policyVersion,
            ImmutableList<Resources.CompletedRequirementInfo> completedRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements,
            ImmutableList<RoleRemoval> roleRemovals
        )
        {
            var requirements = policyVersion
                .Requirements.Select(requirement =>
                {
                    var whenMet = SharedCalculations.FindRequirementApprovals(
                        SharedCalculations.GetRequirementNameWithSynonyms(
                            locationPolicy,
                            requirement.ActionName
                        ),
                        policyVersion.SupersededAtUtc,
                        completedRequirements,
                        exemptedRequirements
                    );
                    return new OrganizationRoleRequirementCompletionStatus(
                        requirement.ActionName,
                        requirement.Stage,
                        whenMet
                    );
                })
                .ToImmutableList();
            var status = SharedCalculations.CalculateRoleVersionApprovalStatus(
                requirements.Select(requirement => (requirement.Stage, requirement.WhenMet))
                    .ToImmutableList(),
                roleRemovals
            );
            return new OrganizationRoleVersionApprovalStatus(
                rolePolicy.OrganizationRoleType,
                policyVersion.Version,
                policyVersion.SupersededAtUtc,
                status,
                requirements
            );
        }
    }
}
