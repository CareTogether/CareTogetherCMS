using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Approvals
{
    public record VolunteerFamilyEntry(
        Guid FamilyId,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        // COMPATIBILITY: This UploadedDocuments property is only used for backwards compatibility.
        // It should not be referenced directly.
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<RoleRemoval> RoleRemovals,
        ImmutableDictionary<Guid, VolunteerEntry> IndividualEntries,
        ImmutableList<Activity> History
    );

    public record RoleRemoval(
        string RoleName,
        RoleRemovalReason Reason,
        // NOTE: Treat 'EffectiveUntil' as "effective *through*", meaning it's no longer effective after that date.
        DateOnly EffectiveSince,
        DateOnly? EffectiveUntil,
        string? AdditionalComments
    );

    public enum RoleRemovalReason
    {
        Inactive,
        OptOut,
        Denied,
    };

    public record VolunteerEntry(
        Guid PersonId,
        bool Active,
        string Note,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<RoleRemoval> RoleRemovals
    );

    [JsonHierarchyBase]
    public abstract partial record VolunteerFamilyCommand(Guid FamilyId);

    public sealed record ActivateVolunteerFamily(Guid FamilyId) : VolunteerFamilyCommand(FamilyId);

    public sealed record CompleteVolunteerFamilyRequirement(
        Guid FamilyId,
        Guid CompletedRequirementId,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : VolunteerFamilyCommand(FamilyId);

    public sealed record MarkVolunteerFamilyRequirementIncomplete(
        Guid FamilyId,
        Guid CompletedRequirementId,
        string RequirementName
    ) : VolunteerFamilyCommand(FamilyId);

    public sealed record ExemptVolunteerFamilyRequirement(
        Guid FamilyId,
        string RequirementName,
        string AdditionalComments,
        DateTime? ExemptionExpiresAtUtc
    ) : VolunteerFamilyCommand(FamilyId);

    public sealed record UnexemptVolunteerFamilyRequirement(Guid FamilyId, string RequirementName)
        : VolunteerFamilyCommand(FamilyId);

    public sealed record UploadVolunteerFamilyDocument(
        Guid FamilyId,
        Guid UploadedDocumentId,
        string UploadedFileName
    ) : VolunteerFamilyCommand(FamilyId);

    public sealed record RemoveVolunteerFamilyRole(
        Guid FamilyId,
        string RoleName,
        RoleRemovalReason Reason,
        string? AdditionalComments,
        DateOnly? EffectiveSince,
        DateOnly? EffectiveThrough
    ) : VolunteerFamilyCommand(FamilyId);

    public sealed record ResetVolunteerFamilyRole(
        Guid FamilyId,
        string RoleName,
        DateOnly? ForRemovalEffectiveSince,
        DateOnly? EffectiveThrough
    ) : VolunteerFamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record VolunteerCommand(Guid FamilyId, Guid PersonId);

    public sealed record CompleteVolunteerRequirement(
        Guid FamilyId,
        Guid PersonId,
        Guid CompletedRequirementId,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : VolunteerCommand(FamilyId, PersonId);

    public sealed record MarkVolunteerRequirementIncomplete(
        Guid FamilyId,
        Guid PersonId,
        Guid CompletedRequirementId,
        string RequirementName
    ) : VolunteerCommand(FamilyId, PersonId);

    public sealed record ExemptVolunteerRequirement(
        Guid FamilyId,
        Guid PersonId,
        string RequirementName,
        string AdditionalComments,
        DateTime? ExemptionExpiresAtUtc
    ) : VolunteerCommand(FamilyId, PersonId);

    public sealed record UnexemptVolunteerRequirement(
        Guid FamilyId,
        Guid PersonId,
        string RequirementName
    ) : VolunteerCommand(FamilyId, PersonId);

    public sealed record RemoveVolunteerRole(
        Guid FamilyId,
        Guid PersonId,
        string RoleName,
        RoleRemovalReason Reason,
        string? AdditionalComments,
        DateOnly? EffectiveSince,
        DateOnly? EffectiveThrough
    ) : VolunteerCommand(FamilyId, PersonId);

    public sealed record ResetVolunteerRole(
        Guid FamilyId,
        Guid PersonId,
        string RoleName,
        DateOnly? ForRemovalEffectiveSince,
        DateOnly? EffectiveThrough
    ) : VolunteerCommand(FamilyId, PersonId);

    /// <summary>
    /// The <see cref="IApprovalsResource"/> models the lifecycle of people's approval status with CareTogether organizations,
    /// including various forms, approval, renewals, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IApprovalsResource
    {
        Task<ImmutableList<VolunteerFamilyEntry>> ListVolunteerFamiliesAsync(
            Guid organizationId,
            Guid locationId
        );

        Task<VolunteerFamilyEntry?> TryGetVolunteerFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        );

        Task<VolunteerFamilyEntry> ExecuteVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            VolunteerFamilyCommand command,
            Guid userId
        );

        Task<VolunteerFamilyEntry> ExecuteVolunteerCommandAsync(
            Guid organizationId,
            Guid locationId,
            VolunteerCommand command,
            Guid userId
        );
    }
}
