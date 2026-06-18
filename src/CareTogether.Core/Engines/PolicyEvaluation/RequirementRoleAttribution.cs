using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    public static class RequirementRoleAttribution
    {
        public static ImmutableList<string> GetDistinctRoleNames(
            (string Version, string RoleName)[] versions
        ) => GetDistinctRoleNames(versions.Select(version => version.RoleName));

        public static ImmutableList<string> GetDistinctRoleNames(IEnumerable<string?> roleNames) =>
            roleNames
                .Select(roleName => roleName?.Trim())
                .Where(roleName => !string.IsNullOrWhiteSpace(roleName))
                .Distinct()
                .Select(roleName => roleName!)
                .ToImmutableList();

        public static ImmutableList<string> GetFamilyRequirementRoleNames(
            EffectiveLocationPolicy locationPolicy,
            ImmutableDictionary<string, FamilyRoleApprovalStatus> familyRoleApprovals,
            string requirementName
        )
        {
            var requirementNames = SharedCalculations
                .GetRequirementNameWithSynonyms(locationPolicy, requirementName)
                .ToImmutableHashSet();

            return GetDistinctRoleNames(
                familyRoleApprovals.Values.SelectMany(approval => approval.RoleVersionApprovals)
                    .SelectMany(roleVersion =>
                        roleVersion
                            .Requirements.Where(requirement =>
                                requirement.Scope == VolunteerFamilyRequirementScope.OncePerFamily
                                && requirementNames.Contains(requirement.ActionName)
                            )
                            .Select(_ => roleVersion.RoleName)
                    )
            );
        }

        public static ImmutableList<string> GetIndividualRequirementRoleNames(
            EffectiveLocationPolicy locationPolicy,
            ImmutableDictionary<string, FamilyRoleApprovalStatus> familyRoleApprovals,
            ImmutableDictionary<string, IndividualRoleApprovalStatus> individualApprovalsByRole,
            Guid personId,
            string requirementName
        )
        {
            var requirementNames = SharedCalculations
                .GetRequirementNameWithSynonyms(locationPolicy, requirementName)
                .ToImmutableHashSet();

            var directIndividualRoleNames = individualApprovalsByRole.Values.SelectMany(approval =>
                approval.RoleVersionApprovals.SelectMany(roleVersion =>
                    roleVersion
                        .Requirements.Where(requirement =>
                            requirementNames.Contains(requirement.ActionName)
                        )
                        .Select(_ => roleVersion.RoleName)
                )
            );

            var familyAdultRequirementRoleNames = familyRoleApprovals.Values.SelectMany(approval =>
                approval.RoleVersionApprovals.SelectMany(roleVersion =>
                    roleVersion
                        .Requirements.Where(requirement =>
                            requirement.Scope != VolunteerFamilyRequirementScope.OncePerFamily
                            && requirementNames.Contains(requirement.ActionName)
                            && requirement.StatusDetails.Any(detail => detail.PersonId == personId)
                        )
                        .Select(_ => roleVersion.RoleName)
                )
            );

            return GetDistinctRoleNames(
                directIndividualRoleNames.Concat(familyAdultRequirementRoleNames)
            );
        }
    }
}
