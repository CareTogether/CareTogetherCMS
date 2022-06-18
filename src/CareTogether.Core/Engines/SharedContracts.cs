using System;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus,
        DateTime? ExpiresAt);

    public enum RoleApprovalStatus { Prospective = 0, Approved = 1, Onboarded = 2 };

    public sealed record CompletedRequirementInfoWithExpiration(Guid UserId, DateTime TimestampUtc,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc, DateTime? ExpiresAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId);
}
