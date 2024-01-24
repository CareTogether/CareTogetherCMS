using System;
using System.Collections.Immutable;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version,
        RoleApprovalStatus ApprovalStatus, DateTime? ExpiresAt);

    public sealed record IndividualRoleApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<RoleRequirementCompletionStatus> RoleRequirementCompletions);

    public sealed record RoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, DateOnlyTimeline? WhenMet);

    public sealed record FamilyRoleApprovalStatus(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? Status,
        ImmutableList<FamilyRoleRequirementCompletionStatus> RoleRequirementCompletions);

    public sealed record FamilyRoleRequirementCompletionStatus(string ActionName,
        RequirementStage Stage, VolunteerFamilyRequirementScope Scope, DateOnlyTimeline? WhenMet,
        ImmutableList<FamilyRequirementStatusDetail> StatusDetails);

    public sealed record FamilyRequirementStatusDetail(string RequirementActionName,
        VolunteerFamilyRequirementScope Scope, Guid? PersonId, DateOnlyTimeline? WhenMet);

    public enum RoleApprovalStatus
    {
        Prospective = 0,
        Expired = 1,
        Approved = 2,
        Onboarded = 3
    };
}
