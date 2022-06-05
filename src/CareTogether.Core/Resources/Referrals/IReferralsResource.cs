using CareTogether.Resources.Policies;
using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Referrals
{
    public record ReferralEntry(Guid Id, Guid FamilyId,
        DateTime OpenedAtUtc, DateTime? ClosedAtUtc, ReferralCloseReason? CloseReason,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableDictionary<Guid, ArrangementEntry> Arrangements,
        ImmutableList<Activity> History,
        string? Comments);

    public record ArrangementEntry(Guid Id, string ArrangementType,
        DateTime RequestedAtUtc, DateTime? StartedAtUtc, DateTime? EndedAtUtc,
        DateTime? CancelledAtUtc,
        Guid PartneringFamilyPersonId,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableSortedSet<ChildLocationHistoryEntry> ChildLocationHistory);

    public enum ReferralCloseReason { NotAppropriate, NoCapacity, NoLongerNeeded, Resourced, NeedMet };

    public sealed record IndividualVolunteerAssignment(Guid FamilyId, Guid PersonId,
        string ArrangementFunction, string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements);
    public sealed record FamilyVolunteerAssignment(Guid FamilyId,
        string ArrangementFunction, string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements);
    public sealed record ChildLocationHistoryEntry(Guid UserId, DateTime TimestampUtc,
        Guid ChildLocationFamilyId, Guid ChildLocationReceivingAdultId, ChildLocationPlan Plan, Guid? NoteId)
        : IComparable<ChildLocationHistoryEntry>
    {
        public int CompareTo(ChildLocationHistoryEntry? other)
        {
            return other == null
                ? 1
                : DateTime.Compare(TimestampUtc, other.TimestampUtc);
        }
    }
    public enum ChildLocationPlan { OvernightHousing, DaytimeChildCare, WithParent }

    [JsonHierarchyBase]
    public abstract partial record ReferralCommand(Guid FamilyId, Guid ReferralId);
    public sealed record CreateReferral(Guid FamilyId, Guid ReferralId,
        DateTime OpenedAtUtc)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record CompleteReferralRequirement(Guid FamilyId, Guid ReferralId,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record MarkReferralRequirementIncomplete(Guid FamilyId, Guid ReferralId,
        Guid CompletedRequirementId, string RequirementName)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record ExemptReferralRequirement(Guid FamilyId, Guid ReferralId,
        string RequirementName, string AdditionalComments, DateTime? ExemptionExpiresAtUtc)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record UnexemptReferralRequirement(Guid FamilyId, Guid ReferralId,
        string RequirementName)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record UpdateCustomReferralField(Guid FamilyId, Guid ReferralId,
        Guid CompletedCustomFieldId, string CustomFieldName, CustomFieldType CustomFieldType, object? Value)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record UpdateReferralComments(Guid FamilyId, Guid ReferralId,
        string? Comments)
        : ReferralCommand(FamilyId, ReferralId);
    public sealed record CloseReferral(Guid FamilyId, Guid ReferralId,
        ReferralCloseReason CloseReason, DateTime ClosedAtUtc)
        : ReferralCommand(FamilyId, ReferralId);

    [JsonHierarchyBase]
    public abstract partial record ArrangementsCommand(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds);
    public sealed record CreateArrangement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementType, DateTime RequestedAtUtc, Guid PartneringFamilyPersonId)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record AssignIndividualVolunteer(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid VolunteerFamilyId, Guid PersonId, string ArrangementFunction, string? ArrangementFunctionVariant)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record AssignVolunteerFamily(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid VolunteerFamilyId, string ArrangementFunction, string? ArrangementFunctionVariant)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record UnassignIndividualVolunteer(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid VolunteerFamilyId, Guid PersonId, string ArrangementFunction, string? ArrangementFunctionVariant)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record UnassignVolunteerFamily(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid VolunteerFamilyId, string ArrangementFunction, string? ArrangementFunctionVariant)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record StartArrangements(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        DateTime StartedAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record CompleteArrangementRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record CompleteVolunteerFamilyAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record CompleteIndividualVolunteerAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        Guid CompletedRequirementId, string RequirementName, DateTime CompletedAtUtc,
        Guid? UploadedDocumentId, Guid? NoteId)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record MarkArrangementRequirementIncomplete(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        Guid CompletedRequirementId, string RequirementName)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record MarkVolunteerFamilyAssignmentRequirementIncomplete(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId,
        Guid CompletedRequirementId, string RequirementName)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record MarkIndividualVolunteerAssignmentRequirementIncomplete(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        Guid CompletedRequirementId, string RequirementName)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record ExemptArrangementRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string RequirementName, DateTime? DueDate, string AdditionalComments, DateTime? ExemptionExpiresAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record ExemptVolunteerFamilyAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        string RequirementName, DateTime? DueDate, string AdditionalComments, DateTime? ExemptionExpiresAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record ExemptIndividualVolunteerAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        string RequirementName, DateTime? DueDate, string AdditionalComments, DateTime? ExemptionExpiresAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record UnexemptArrangementRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string RequirementName, DateTime? DueDate)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record UnexemptVolunteerFamilyAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        string RequirementName, DateTime? DueDate)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record UnexemptIndividualVolunteerAssignmentRequirement(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        string ArrangementFunction, string? ArrangementFunctionVariant, Guid VolunteerFamilyId, Guid PersonId,
        string RequirementName, DateTime? DueDate)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record TrackChildLocationChange(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        DateTime ChangedAtUtc, Guid ChildLocationFamilyId, Guid ChildLocationReceivingAdultId, ChildLocationPlan Plan, Guid? NoteId)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record EndArrangements(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        DateTime EndedAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);
    public sealed record CancelArrangementsSetup(Guid FamilyId, Guid ReferralId, ImmutableList<Guid> ArrangementIds,
        DateTime CancelledAtUtc)
        : ArrangementsCommand(FamilyId, ReferralId, ArrangementIds);

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

        Task<ReferralEntry> ExecuteArrangementsCommandAsync(Guid organizationId, Guid locationId,
            ArrangementsCommand command, Guid userId);
    }
}
