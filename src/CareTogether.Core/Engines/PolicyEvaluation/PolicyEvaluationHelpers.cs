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
    }
}
