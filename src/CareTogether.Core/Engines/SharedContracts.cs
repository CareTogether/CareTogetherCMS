using System;
using System.Collections.Immutable;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version,
        RoleApprovalStatus ApprovalStatus, DateTime? ExpiresAt);

    public sealed record RoleVersionApproval2(string Version,
        DateOnlyTimeline<RoleApprovalStatus>? ApprovalStatus,
        ImmutableList<RoleRequirementStatus> RequirementStatuses);

    public sealed record RoleRequirementStatus(string ActionName,
        RequirementStage Stage, DateOnlyTimeline? WhenMet);

    public enum RoleApprovalStatus
    {
        Prospective = 0,
        Expired = 1,
        Approved = 2,
        Onboarded = 3
    };
}
