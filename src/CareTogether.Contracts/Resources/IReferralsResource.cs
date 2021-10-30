using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public record ReferralEntry(Guid Id, Guid FamilyId,
        DateTime CreatedUtc, ReferralCloseReason? CloseReason,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableDictionary<Guid, ArrangementEntry> Arrangements);

    public record ArrangementEntry(Guid Id, string ArrangementType,
        ArrangementState State, DateTime? StartedAtUtc, DateTime? EndedAtUtc,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableDictionary<Guid, NoteEntry> Notes);

    public enum ReferralCloseReason { NotAppropriate, NoCapacity, NoLongerNeeded, Resourced, NeedMet };

    public enum ArrangementState { Setup, Open, Closed };

    public sealed record IndividualVolunteerAssignment(Guid FamilyId, Guid PersonId, string ArrangementFunction);
    public sealed record FamilyVolunteerAssignment(Guid FamilyId, string ArrangementFunction);
    public sealed record PartneringFamilyChildAssignment(Guid PersonId);
    public sealed record ChildLocationHistoryEntry(Guid UserId, DateTime TimestampUtc,
        Guid ChildId, Guid ChildLocationFamilyId, ChildLocationPlan Plan, string AdditionalExplanation);

    public enum ChildLocationPlan { OvernightHousing, DaytimeChildCare, ReturnToFamily }

    public record NoteEntry(Guid Id, Guid AuthorId, DateTime LastEditTimestampUtc, NoteStatus Status,
        string? Contents, Guid? ApproverId, DateTime? ApprovedTimestampUtc);

    public enum NoteStatus { Draft, Approved };

    [JsonHierarchyBase]
    public abstract partial record ReferralCommand(Guid ReferralId);
    public sealed record CreateReferral(Guid ReferralId,
        Guid FamilyId, DateTime OpenedAtUtc)
        : ReferralCommand(ReferralId);
    public sealed record CompleteReferralRequirement(Guid ReferralId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : ReferralCommand(ReferralId);
    public sealed record UploadReferralDocument(Guid ReferralId,
        Guid UploadedDocumentId, string UploadedFileName)
        : ReferralCommand(ReferralId);
    public sealed record CloseReferral(Guid ReferralId,
        ReferralCloseReason CloseReason)
        : ReferralCommand(ReferralId);

    [JsonHierarchyBase]
    public abstract partial record ArrangementCommand(Guid ReferralId, Guid ArrangementId);
    public sealed record CreateArrangement(Guid ReferralId, Guid ArrangementId,
        string ArrangementType)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record AssignIndividualVolunteer(Guid ReferralId, Guid ArrangementId,
        Guid VolunteerFamilyId, Guid PersonId, string ArrangementFunction)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record AssignVolunteerFamily(Guid ReferralId, Guid ArrangementId,
        Guid VolunteerFamilyId, string ArrangementFunction)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record AssignPartneringFamilyChildren(Guid ReferralId, Guid ArrangementId,
        ImmutableList<Guid> ChildrenIds)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record StartArrangement(Guid ReferralId, Guid ArrangementId,
        DateTime StartedAtUtc)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record CompleteArrangementRequirement(Guid ReferralId, Guid ArrangementId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record UploadArrangementDocument(Guid ReferralId, Guid ArrangementId,
        Guid UploadedDocumentId, string UploadedFileName)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record TrackChildLocationChange(Guid ReferralId, Guid ArrangementId,
        DateTime ChangedAtUtc, Guid ChildId, Guid ChildLocationFamilyId, ChildLocationPlan Plan, string AdditionalExplanation)
        : ArrangementCommand(ReferralId, ArrangementId);
    public sealed record EndArrangement(Guid ReferralId, Guid ArrangementId,
        DateTime EndedAtUtc)
        : ArrangementCommand(ReferralId, ArrangementId);

    [JsonHierarchyBase]
    public abstract partial record ArrangementNoteCommand(Guid ReferralId, Guid ArrangementId, Guid NoteId);
    public sealed record CreateDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid NoteId,
        string? DraftNoteContents)
        : ArrangementNoteCommand(ReferralId, ArrangementId, NoteId);
    public sealed record EditDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid NoteId,
        string? DraftNoteContents)
        : ArrangementNoteCommand(ReferralId, ArrangementId, NoteId);
    public sealed record DiscardDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid NoteId)
        : ArrangementNoteCommand(ReferralId, ArrangementId, NoteId);
    public sealed record ApproveArrangementNote(Guid ReferralId, Guid ArrangementId, Guid NoteId,
        string FinalizedNoteContents)
        : ArrangementNoteCommand(ReferralId, ArrangementId, NoteId);

    /// <summary>
    /// The <see cref="IReferralsResource"/> models the lifecycle of people's referrals to CareTogether organizations,
    /// including various forms, arrangements, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IReferralsResource
    {
        Task<ImmutableList<ReferralEntry>> ListReferralsAsync(Guid organizationId, Guid locationId);

        Task<ReferralEntry> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId);

        Task<ReferralEntry> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ReferralCommand command, Guid userId);

        Task<ReferralEntry> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ArrangementCommand command, Guid userId);

        Task<ReferralEntry> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ArrangementNoteCommand command, Guid userId);
    }
}
