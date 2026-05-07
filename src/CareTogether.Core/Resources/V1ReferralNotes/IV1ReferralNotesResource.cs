using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.V1ReferralNotes
{
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
