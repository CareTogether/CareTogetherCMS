using System;
using CareTogether.Engines.PolicyEvaluation;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version,
        RoleApprovalStatus ApprovalStatus, DateTime? ExpiresAt);
}
