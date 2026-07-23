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

        internal static bool ShouldShowApplicationPrompt(RoleApprovalStatus? effectiveStatus) =>
            effectiveStatus is null or RoleApprovalStatus.Expired;

        internal static ImmutableList<IndividualRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<IndividualRoleVersionApprovalStatus> versions
        ) => versions.Where(IsActive).ToImmutableList();

        internal static ImmutableList<IndividualRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<IndividualRoleVersionApprovalStatus> versions,
            RoleApprovalStatus? effectiveStatus
        )
        {
            var activeVersions = SelectPromptableVersions(versions);
            if (effectiveStatus == RoleApprovalStatus.Expired)
                return activeVersions;

            var activeStatus = GetMaxRoleStatus(activeVersions);
            return activeStatus == effectiveStatus
                ? activeVersions
                : ImmutableList<IndividualRoleVersionApprovalStatus>.Empty;
        }

        internal static ImmutableList<FamilyRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions
        ) => versions.Where(IsActive).ToImmutableList();

        internal static ImmutableList<FamilyRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions,
            RoleApprovalStatus? effectiveStatus
        )
        {
            var activeVersions = SelectPromptableVersions(versions);
            if (effectiveStatus == RoleApprovalStatus.Expired)
                return activeVersions;

            var activeStatus = GetMaxRoleStatus(activeVersions);
            return activeStatus == effectiveStatus
                ? activeVersions
                : ImmutableList<FamilyRoleVersionApprovalStatus>.Empty;
        }

        private static bool IsActive(IndividualRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;

        private static bool IsActive(FamilyRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;
    }
}
