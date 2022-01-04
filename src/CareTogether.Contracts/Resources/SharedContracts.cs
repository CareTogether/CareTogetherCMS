using System;

namespace CareTogether.Resources
{
    public sealed record CompletedRequirementInfo(Guid UserId, DateTime TimestampUtc,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId);

    public sealed record ExemptedRequirementInfo(Guid UserId, DateTime TimestampUtc,
        string RequirementName, string AdditionalComments, DateTime? ExemptionExpiresAtUtc);

    public sealed record UploadedDocumentInfo(Guid UserId, DateTime TimestampUtc,
        Guid UploadedDocumentId, string UploadedFileName);
}
