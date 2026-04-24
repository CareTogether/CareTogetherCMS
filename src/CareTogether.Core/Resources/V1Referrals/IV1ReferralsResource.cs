using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Resources.Policies;
using JsonPolymorph;

namespace CareTogether.Resources.V1Referrals
{
    public sealed record V1Referral(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        V1ReferralStatus Status,
        string? Comment,
        DateTime? AcceptedAtUtc,
        DateTime? ClosedAtUtc,
        string? CloseReason,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<Guid> DeletedDocuments,
        ImmutableList<V1ReferralNoteEntry> Notes
    )
    {
        public ImmutableList<RequirementDefinition> MissingIntakeRequirements { get; init; } =
            ImmutableList<RequirementDefinition>.Empty;
    }

    public enum V1ReferralStatus
    {
        Open,
        Accepted,
        Closed,
    }

    [JsonHierarchyBase]
    public abstract partial record V1ReferralCommand(Guid ReferralId);

    public sealed record CreateV1Referral(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        string? Comment
    ) : V1ReferralCommand(ReferralId);

    public sealed record UpdateV1ReferralFamily(Guid ReferralId, Guid FamilyId)
        : V1ReferralCommand(ReferralId);

    public sealed record AcceptV1Referral(Guid ReferralId, DateTime AcceptedAtUtc)
        : V1ReferralCommand(ReferralId);

    public sealed record CloseV1Referral(Guid ReferralId, DateTime ClosedAtUtc, string CloseReason)
        : V1ReferralCommand(ReferralId);

    public sealed record ReopenV1Referral(Guid ReferralId, DateTime ReopenedAtUtc)
        : V1ReferralCommand(ReferralId);

    public sealed record UpdateV1ReferralDetails(
        Guid ReferralId,
        string Title,
        string? Comment,
        DateTime CreatedAtUtc
    ) : V1ReferralCommand(ReferralId);

    public sealed record UpdateCustomV1ReferralField(
        Guid ReferralId,
        Guid CompletedCustomFieldId,
        string CustomFieldName,
        CustomFieldType CustomFieldType,
        object? Value
    ) : V1ReferralCommand(ReferralId);

    public sealed record CompleteReferralRequirement(
        Guid ReferralId,
        Guid CompletedRequirementId,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : V1ReferralCommand(ReferralId);

    public sealed record MarkReferralRequirementIncomplete(
        Guid ReferralId,
        Guid CompletedRequirementId,
        string RequirementName
    ) : V1ReferralCommand(ReferralId);

    public sealed record ExemptReferralRequirement(
        Guid ReferralId,
        string RequirementName,
        string AdditionalComments,
        DateTime? ExemptionExpiresAtUtc
    ) : V1ReferralCommand(ReferralId);

    public sealed record UnexemptReferralRequirement(Guid ReferralId, string RequirementName)
        : V1ReferralCommand(ReferralId);

    public sealed record UploadV1ReferralDocument(
        Guid ReferralId,
        Guid UploadedDocumentId,
        string UploadedFileName
    ) : V1ReferralCommand(ReferralId);

    public sealed record DeleteUploadedV1ReferralDocument(Guid ReferralId, Guid UploadedDocumentId)
        : V1ReferralCommand(ReferralId);

    public record V1ReferralNoteEntry(
        Guid Id,
        Guid ReferralId,
        Guid AuthorId,
        DateTime? CreatedTimestampUtc,
        DateTime LastEditTimestampUtc,
        V1ReferralNoteStatus Status,
        string? Contents,
        Guid? ApproverId,
        DateTime? ApprovedTimestampUtc,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel
    );

    public enum V1ReferralNoteStatus
    {
        Draft,
        Approved,
    }

    [JsonHierarchyBase]
    public abstract partial record V1ReferralNoteCommand(Guid ReferralId, Guid NoteId);

    public sealed record CreateV1ReferralDraftNote(
        Guid ReferralId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record EditV1ReferralDraftNote(
        Guid ReferralId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record DiscardV1ReferralDraftNote(Guid ReferralId, Guid NoteId)
        : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record ApproveV1ReferralNote(
        Guid ReferralId,
        Guid NoteId,
        string FinalizedNoteContents,
        DateTime? BackdatedTimestampUtc,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public sealed record UpdateV1ReferralNoteAccessLevel(
        Guid ReferralId,
        Guid NoteId,
        string? AccessLevel = null
    ) : V1ReferralNoteCommand(ReferralId, NoteId);

    public interface IV1ReferralsResource
    {
        Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        );

        Task<V1Referral?> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId);

        Task<ImmutableList<V1Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);
    }

    public interface IV1ReferralDocumentsResource
    {
        Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        );

        Task<Uri> GetV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid referralId,
            Guid documentId
        );
    }

    public interface IV1ReferralNotesResource
    {
        Task<ImmutableList<V1ReferralNoteEntry>> ListReferralNotesAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        );

        Task<V1ReferralNoteEntry?> ExecuteReferralNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralNoteCommand command,
            Guid userId
        );
    }
}
