using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public record Referral(Guid Id, string PolicyVersion,
        DateTime CreatedUtc, ReferralCloseReason? CloseReason,
        Family PartneringFamily,
        ImmutableList<ContactInfo> Contacts,
        ImmutableList<FormUploadInfo> ReferralFormUploads,
        ImmutableList<ActivityInfo> ReferralActivitiesPerformed,
        ImmutableList<Arrangement> Arrangements);

    public record Arrangement(Guid Id, string PolicyVersion, string ArrangementType,
        ArrangementState State,
        ImmutableList<FormUploadInfo> ArrangementFormUploads,
        ImmutableList<ActivityInfo> ArrangementActivitiesPerformed,
        ImmutableList<VolunteerAssignment> VolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildrenLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableList<Note> Notes);

    public record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status);

    public interface IReferralManager
    {
        Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);

        Task<ManagerResult<Referral>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<ManagerResult<Referral>> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);

        Task<ManagerResult<Referral>> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command);
    }
}
