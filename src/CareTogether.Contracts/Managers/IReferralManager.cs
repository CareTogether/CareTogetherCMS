using CareTogether.Resources;
using JsonPolymorph;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public record Referral(Guid Id, int PolicyVersion,
        ReferralCloseReason? CloseReason,
        Family PartneringFamily,
        ImmutableList<ContactInfo> Contacts,
        ImmutableList<FormUploadInfo> ReferralFormUploads,
        ImmutableList<ActivityInfo> ReferralActivitiesPerformed,
        ImmutableList<Arrangement> Arrangements);

    public record Arrangement(Guid Id, int PolicyVersion, string ArrangementType,
        ImmutableList<FormUploadInfo> ArrangementFormUploads,
        ImmutableList<ActivityInfo> ArrangementActivitiesPerformed,
        ImmutableList<VolunteerAssignment> VolunteerAssignments);

    public sealed record FormUploadInfo(Guid UserId, DateTime TimestampUtc,
        string FormName, string FormVersion, string UploadedFileName);
    public sealed record ActivityInfo(Guid UserId, DateTime TimestampUtc,
        string ActivityName);

    [JsonHierarchyBase]
    public abstract partial record VolunteerAssignment(string ArrangementFunction);
    public sealed record IndividualVolunteerAssignment(Guid PersonId, string ArrangementFunction)
        : VolunteerAssignment(ArrangementFunction);
    public sealed record FamilyVolunteerAssignment(Guid FamilyId, string ArrangementFunction)
        : VolunteerAssignment(ArrangementFunction);

    public enum ReferralCloseReason { NotAppropriate, Resourced, NoCapacity, NoLongerNeeded, NeedMet };

    [JsonHierarchyBase]
    public abstract partial record ReferralCommand(Guid ReferralId, Guid UserId); //TODO: Include timestamp?
    public sealed record CreateReferral(Guid ReferralId, Guid UserId, Guid FamilyId);
    public sealed record PerformReferralActivity(Guid ReferralId, Guid UserId,
        string ActivityName)
        : ReferralCommand(ReferralId, UserId);
    public sealed record UploadReferralForm(Guid ReferralId, Guid UserId,
        string FormName, string FormVersion, string UploadedFileName)
        : ReferralCommand(ReferralId, UserId);

    [JsonHierarchyBase]
    public abstract partial record ArrangementCommand(Guid ReferralId, Guid ArrangementId, Guid UserId); //TODO: Include timestamp?
    public sealed record CreateArrangement(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string ArrangementType)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record AssignIndividualVolunteer(Guid ReferralId, Guid ArrangementId, Guid UserId,
        Guid PersonId, string ArrangementFunction)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record AssignVolunteerFamily(Guid ReferralId, Guid ArrangementId, Guid UserId,
        Guid FamilyId, string ArrangementFunction)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record AssignPartneringFamilyChildren(Guid ReferralId, Guid ArrangementId, Guid UserId,
        IImmutableList<Guid> ChildrenIds)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record UploadArrangementForm(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string FormName, string FormVersion, string UploadedFileName)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record PerformArrangementActivity(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string ActivityName)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record TrackChildrenLocationChange(Guid ReferralId, Guid ArrangementId, Guid UserId,
        IImmutableList<Guid> ChildrenIds, Guid FamilyId, ChildrenLocationChangePlan Reason, string AdditionalExplanation);
    public sealed record RecordDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string DraftNote)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record EditDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string RevisedDraftNote)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record ApproveDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid UserId)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);
    public sealed record RejectDraftArrangementNote(Guid ReferralId, Guid ArrangementId, Guid UserId,
        string RejectionExplanation)
        : ArrangementCommand(ReferralId, ArrangementId, UserId);

    public enum ChildrenLocationChangePlan { OvernightHousing, DaytimeChildCare, ReturnToFamily }

    /// <summary>
    /// The <see cref="IReferralManager"/> models the lifecycle of people's referrals to CareTogether organizations,
    /// including various forms, arrangements, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IReferralManager
    {
        Task<IImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);

        Task<ResourceResult<Referral>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId, ReferralCommand command);

        Task<ResourceResult<Referral>> ExecuteArrangementCommand(Guid organizationId, Guid locationId, ArrangementCommand command);
    }
}
