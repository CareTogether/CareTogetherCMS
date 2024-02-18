using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record FamilyApprovalStatus(
        ImmutableDictionary<Guid, IndividualApprovalStatus> IndividualApprovals,
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals);

    public sealed record IndividualApprovalStatus(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole);

    public sealed record IndividualRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<IndividualRoleVersionApprovalStatus> RoleVersionApprovals)
    {
        public RoleApprovalStatus? CurrentStatus =>
            EffectiveRoleApprovalStatus?.ValueAt(DateTime.UtcNow);
    }

    public sealed record IndividualRoleVersionApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<IndividualRoleRequirementCompletionStatus> Requirements);

    public sealed record IndividualRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, DateOnlyTimeline? WhenMet);

    public sealed record FamilyRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<FamilyRoleVersionApprovalStatus> RoleVersionApprovals)
    {
        public RoleApprovalStatus? CurrentStatus =>
            EffectiveRoleApprovalStatus?.ValueAt(DateTime.UtcNow);
    }

    public sealed record FamilyRoleVersionApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<FamilyRoleRequirementCompletionStatus> Requirements);

    public sealed record FamilyRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, VolunteerFamilyRequirementScope Scope, DateOnlyTimeline? WhenMet,
        ImmutableList<FamilyRequirementStatusDetail> StatusDetails);

    public sealed record FamilyRequirementStatusDetail(
        Guid? PersonId, DateOnlyTimeline? WhenMet);

    public enum RoleApprovalStatus
    {
        Prospective = 0,
        Expired = 1,
        Approved = 2,
        Onboarded = 3
    };

    public sealed record ReferralStatus(
        ImmutableList<string> MissingIntakeRequirements,
        ImmutableList<string> MissingCustomFields,
        ImmutableDictionary<Guid, ArrangementStatus> IndividualArrangements);

    public sealed record ArrangementStatus(
        ArrangementPhase Phase,
        ImmutableList<MissingArrangementRequirement> MissingRequirements);

    public sealed record MissingArrangementRequirement(
        string? ArrangementFunction, string? ArrangementFunctionVariant,
        Guid? VolunteerFamilyId, Guid? PersonId,
        string ActionName, DateTime? DueBy, DateTime? PastDueSince);

    public enum ArrangementPhase { SettingUp, ReadyToStart, Started, Ended, Cancelled };

    public interface IPolicyEvaluationEngine
    {
        //TODO: Merge this with the CombinedFamilyInfoFormatter logic
        Task<FamilyApprovalStatus> CalculateCombinedFamilyApprovalsAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles);

        Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry);
    }
}
