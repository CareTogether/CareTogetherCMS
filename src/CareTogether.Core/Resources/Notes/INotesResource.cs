using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Notes
{
    public record NoteEntry(
        Guid Id,
        Guid FamilyId,
        Guid AuthorId,
        DateTime LastEditTimestampUtc,
        NoteStatus Status,
        string? Contents,
        Guid? ApproverId,
        DateTime? ApprovedTimestampUtc,
        DateTime? BackdatedTimestampUtc
    );

    public enum NoteStatus
    {
        Draft,
        Approved,
    }

    [JsonHierarchyBase]
    public abstract partial record NoteCommand(Guid FamilyId, Guid NoteId);

    public sealed record CreateDraftNote(
        Guid FamilyId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc
    ) : NoteCommand(FamilyId, NoteId);

    public sealed record EditDraftNote(
        Guid FamilyId,
        Guid NoteId,
        string? DraftNoteContents,
        DateTime? BackdatedTimestampUtc
    ) : NoteCommand(FamilyId, NoteId);

    public sealed record DiscardDraftNote(Guid FamilyId, Guid NoteId) : NoteCommand(FamilyId, NoteId);

    public sealed record ApproveNote(
        Guid FamilyId,
        Guid NoteId,
        string FinalizedNoteContents,
        DateTime? BackdatedTimestampUtc
    ) : NoteCommand(FamilyId, NoteId);

    /// <summary>
    ///     The <see cref="INotesResource" /> models the lifecycle of record-keeping notes in CareTogether organizations,
    ///     which are always kept at the family level, as well as authorizing related queries.
    /// </summary>
    public interface INotesResource
    {
        Task<ImmutableList<NoteEntry>> ListFamilyNotesAsync(Guid organizationId, Guid locationId, Guid familyId);

        Task<NoteEntry?> ExecuteNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            NoteCommand command,
            Guid userId
        );
    }
}
