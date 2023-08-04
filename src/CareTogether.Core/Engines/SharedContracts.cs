using System;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus,
        DateTime? ExpiresAt);

    public enum RoleApprovalStatus { Prospective = 0, Expired = 1, Approved = 2, Onboarded = 3 };
}
