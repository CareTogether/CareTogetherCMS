using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public record PartneringFamily(Family Family,
        Referral? OpenReferral,
        ImmutableList<Referral> ClosedReferrals);

    public record Referral(Guid Id,
        DateTime CreatedUtc, ReferralCloseReason? CloseReason,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingRequirements,
        ImmutableList<Arrangement> Arrangements);

    public record Arrangement(Guid Id, string ArrangementType,
        ArrangementState State,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableList<Note> Notes);

    public record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status);

    public interface IReferralManager
    {
        Task<ImmutableList<PartneringFamily>> ListPartneringFamiliesAsync(Guid organizationId, Guid locationId);

        Task<Referral> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<Referral> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);

        Task<Referral> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command);
    }
}
