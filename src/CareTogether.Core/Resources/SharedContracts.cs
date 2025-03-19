using System;
using CareTogether.Resources.Policies;
using JsonPolymorph;

namespace CareTogether.Resources
{
    public sealed record CompletedRequirementInfo(Guid UserId, DateTime TimestampUtc,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc, DateTime? ExpiresAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId);

    public sealed record ExemptedRequirementInfo(Guid UserId, DateTime TimestampUtc,
        string RequirementName, DateTime? DueDate, string AdditionalComments, DateTime? ExemptionExpiresAtUtc);

    public sealed record UploadedDocumentInfo(Guid UserId, DateTime TimestampUtc,
        Guid UploadedDocumentId, string UploadedFileName);

    public sealed record CompletedCustomFieldInfo(Guid UserId, DateTime TimestampUtc,
        Guid CompletedCustomFieldId, string CustomFieldName, CustomFieldType CustomFieldType, object? Value);

    [JsonHierarchyBase]
    public abstract partial record Activity(Guid UserId, DateTime AuditTimestampUtc, DateTime ActivityTimestampUtc,
        Guid? UploadedDocumentId, Guid? NoteId);
}
