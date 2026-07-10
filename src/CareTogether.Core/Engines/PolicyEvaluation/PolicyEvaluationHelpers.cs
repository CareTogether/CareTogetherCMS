using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class PolicyEvaluationHelpers
    {
        internal static RoleApprovalStatus? GetMaxRoleStatus(
            ImmutableList<IndividualRoleVersionApprovalStatus> versions
        ) =>
            versions
                .Select(r => r.CurrentStatus)
                .Where(s => s != null)
                .OfType<RoleApprovalStatus>()
                .DefaultIfEmpty()
                .Max();

        internal static RoleApprovalStatus? GetMaxRoleStatus(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions
        ) =>
            versions
                .Select(r => r.CurrentStatus)
                .Where(s => s != null)
                .OfType<RoleApprovalStatus>()
                .DefaultIfEmpty()
                .Max();

        internal static ImmutableList<IndividualRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<IndividualRoleVersionApprovalStatus> versions
        )
        {
            var activeVersions = versions.Where(IsActive).ToImmutableList();
            return activeVersions.Count > 0 ? activeVersions : versions;
        }

        internal static ImmutableList<FamilyRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions
        )
        {
            var activeVersions = versions.Where(IsActive).ToImmutableList();
            return activeVersions.Count > 0 ? activeVersions : versions;
        }

        private static bool IsActive(IndividualRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;

        private static bool IsActive(FamilyRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;
    }
}
