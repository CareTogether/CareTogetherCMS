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
        )
        {
            var statuses = versions
                .Select(r => r.CurrentStatus)
                .Where(s => s != null)
                .OfType<RoleApprovalStatus>()
                .ToImmutableList();

            return statuses.Count == 0 ? null : statuses.Max();
        }

        internal static RoleApprovalStatus? GetMaxRoleStatus(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions
        )
        {
            var statuses = versions
                .Select(r => r.CurrentStatus)
                .Where(s => s != null)
                .OfType<RoleApprovalStatus>()
                .ToImmutableList();

            return statuses.Count == 0 ? null : statuses.Max();
        }

        internal static RoleApprovalStatus? GetMaxRoleStatus(
            ImmutableList<OrganizationRoleVersionApprovalStatus> versions
        )
        {
            var statuses = versions
                .Select(version => version.CurrentStatus)
                .Where(status => status != null)
                .OfType<RoleApprovalStatus>()
                .ToImmutableList();

            return statuses.Count == 0 ? null : statuses.Max();
        }

        internal static ImmutableList<IndividualRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<IndividualRoleVersionApprovalStatus> versions,
            RoleApprovalStatus? effectiveStatus
        )
        {
            // A valid onboarding carries across policy versions until it expires.
            if (effectiveStatus == RoleApprovalStatus.Onboarded)
                return ImmutableList<IndividualRoleVersionApprovalStatus>.Empty;

            // Superseded versions contribute to effective status but never prompt. Among active
            // versions, only workflows tied for the most advanced current status can prompt.
            var activeVersions = versions.Where(IsActive).ToImmutableList();
            var maxActiveStatus = GetMaxRoleStatus(activeVersions);
            return maxActiveStatus == null
                ? activeVersions
                : activeVersions
                    .Where(version => version.CurrentStatus == maxActiveStatus)
                    .ToImmutableList();
        }

        internal static ImmutableList<FamilyRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<FamilyRoleVersionApprovalStatus> versions,
            RoleApprovalStatus? effectiveStatus
        )
        {
            // A valid onboarding carries across policy versions until it expires.
            if (effectiveStatus == RoleApprovalStatus.Onboarded)
                return ImmutableList<FamilyRoleVersionApprovalStatus>.Empty;

            // Keep this overload aligned with the individual-role selection above.
            var activeVersions = versions.Where(IsActive).ToImmutableList();
            var maxActiveStatus = GetMaxRoleStatus(activeVersions);
            return maxActiveStatus == null
                ? activeVersions
                : activeVersions
                    .Where(version => version.CurrentStatus == maxActiveStatus)
                    .ToImmutableList();
        }

        internal static ImmutableList<OrganizationRoleVersionApprovalStatus> SelectPromptableVersions(
            ImmutableList<OrganizationRoleVersionApprovalStatus> versions,
            RoleApprovalStatus? effectiveStatus
        )
        {
            if (effectiveStatus == RoleApprovalStatus.Onboarded)
                return ImmutableList<OrganizationRoleVersionApprovalStatus>.Empty;

            var activeVersions = versions.Where(IsActive).ToImmutableList();
            var maxActiveStatus = GetMaxRoleStatus(activeVersions);
            return maxActiveStatus == null
                ? activeVersions
                : activeVersions
                    .Where(version => version.CurrentStatus == maxActiveStatus)
                    .ToImmutableList();
        }

        private static bool IsActive(IndividualRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;

        private static bool IsActive(FamilyRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;

        private static bool IsActive(OrganizationRoleVersionApprovalStatus version) =>
            version.SupersededAtUtc == null || version.SupersededAtUtc > DateTime.UtcNow;
    }
}
