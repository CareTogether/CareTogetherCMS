using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class PolicyEvaluationHelpers
    {
        internal static ImmutableList<RequirementStage> GetStagesToHide(
            RoleApprovalStatus highestStatus
        ) =>
            highestStatus switch
            {
                RoleApprovalStatus.Onboarded => ImmutableList.Create(
                    RequirementStage.Application,
                    RequirementStage.Approval,
                    RequirementStage.Onboarding
                ),
                RoleApprovalStatus.Approved => ImmutableList.Create(
                    RequirementStage.Application,
                    RequirementStage.Approval
                ),
                RoleApprovalStatus.Prospective => ImmutableList.Create(
                    RequirementStage.Application
                ),
                _ => ImmutableList<RequirementStage>.Empty,
            };

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
