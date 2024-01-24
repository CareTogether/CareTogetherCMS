using System;
using System.Collections.Immutable;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version,
        RoleApprovalStatus ApprovalStatus, DateTime? ExpiresAt);

    public sealed record FamilyApprovalStatus(
        ImmutableDictionary<Guid, IndividualApprovalStatus> IndividualApprovals,
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals);
    //TODO: Do we need to include the removed family roles here?

    public sealed record IndividualApprovalStatus(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole);
    //TODO: Do we need to include the removed individual roles here?

    public sealed record IndividualRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus>? EffectiveRoleApprovalStatus,
        ImmutableList<IndividualRoleVersionApprovalStatus> RoleVersionApprovals);

    public sealed record IndividualRoleVersionApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<IndividualRoleRequirementCompletionStatus> Requirements);

    public sealed record IndividualRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, DateOnlyTimeline? WhenMet);

    public sealed record FamilyRoleApprovalStatus(
        DateOnlyTimeline<RoleApprovalStatus> EffectiveRoleApprovalStatus,
        ImmutableList<FamilyRoleVersionApprovalStatus> RoleVersionApprovals);

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
}
