using System;

namespace CareTogether.Resources
{
    public sealed record CompletedRequirementInfo(Guid UserId, DateTime TimestampUtc,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId);

    public sealed record UploadedDocumentInfo(Guid UserId, DateTime TimestampUtc,
        Guid UploadedDocumentId, string UploadedFileName);
}
