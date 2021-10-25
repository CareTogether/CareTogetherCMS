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

    public record Referral(Guid Id, string PolicyVersion,
        DateTime CreatedUtc, ReferralCloseReason? CloseReason,
        ImmutableList<FormUploadInfo> ReferralFormUploads, //TODO: Consolidate similar to how Volunteers was streamlined
        ImmutableList<ActivityInfo> ReferralActivitiesPerformed, //TODO: Consolidate similar to how Volunteers was streamlined
        ImmutableList<Arrangement> Arrangements);

    public record Arrangement(Guid Id, string PolicyVersion, string ArrangementType,
        ArrangementState State,
        ImmutableList<FormUploadInfo> ArrangementFormUploads, //TODO: Consolidate similar to how Volunteers was streamlined
        ImmutableList<ActivityInfo> ArrangementActivitiesPerformed, //TODO: Consolidate similar to how Volunteers was streamlined
        ImmutableList<VolunteerAssignment> VolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildrenLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableList<Note> Notes);

    public record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status);

    public interface IReferralManager
    {
        Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);

        Task<Referral> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<Referral> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);

        Task<Referral> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command);
    }
}
