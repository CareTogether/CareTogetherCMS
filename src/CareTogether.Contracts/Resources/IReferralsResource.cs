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
        DateTime RequestedAtUtc, DateTime? StartedAtUtc, DateTime? EndedAtUtc,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildLocationHistoryEntry> ChildrenLocationHistory);

    public enum ReferralCloseReason { NotAppropriate, NoCapacity, NoLongerNeeded, Resourced, NeedMet };

    public sealed record IndividualVolunteerAssignment(Guid FamilyId, Guid PersonId, string ArrangementFunction);
    public sealed record FamilyVolunteerAssignment(Guid FamilyId, string ArrangementFunction);
    public sealed record PartneringFamilyChildAssignment(Guid PersonId);
    public sealed record ChildLocationHistoryEntry(Guid UserId, DateTime TimestampUtc,
        Guid ChildId, Guid ChildLocationFamilyId, ChildLocationPlan Plan, string AdditionalExplanation);

    public enum ChildLocationPlan { OvernightHousing, DaytimeChildCare, ReturnToFamily }

    [JsonHierarchyBase]
    public abstract partial record ReferralCommand(Guid FamilyId, Guid ReferralId);
    public sealed record CreateReferral(Guid FamilyId, Guid ReferralId,
        DateTime OpenedAtUtc)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record CompleteReferralRequirement(Guid FamilyId, Guid ReferralId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record UploadReferralDocument(Guid FamilyId, Guid ReferralId,
        Guid UploadedDocumentId, string UploadedFileName)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record CloseReferral(Guid FamilyId, Guid ReferralId,
        ReferralCloseReason CloseReason)
        : ReferralCommand(FamilyId, ReferralId);

    [JsonHierarchyBase]
    public abstract partial record ArrangementCommand(Guid FamilyId, Guid ReferralId, Guid ArrangementId);
    public sealed record CreateArrangement(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        string ArrangementType)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record AssignIndividualVolunteer(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        Guid VolunteerFamilyId, Guid PersonId, string ArrangementFunction)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record AssignVolunteerFamily(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        Guid VolunteerFamilyId, string ArrangementFunction)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record AssignPartneringFamilyChildren(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        ImmutableList<Guid> ChildrenIds)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record StartArrangement(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        DateTime StartedAtUtc)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record CompleteArrangementRequirement(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record UploadArrangementDocument(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        Guid UploadedDocumentId, string UploadedFileName)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record TrackChildLocationChange(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        DateTime ChangedAtUtc, Guid ChildId, Guid ChildLocationFamilyId, ChildLocationPlan Plan, string AdditionalExplanation)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);
    public sealed record EndArrangement(Guid FamilyId, Guid ReferralId, Guid ArrangementId,
        DateTime EndedAtUtc)
        : ArrangementCommand(FamilyId, ReferralId, ArrangementId);

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
    }
}
