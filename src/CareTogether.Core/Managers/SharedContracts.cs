using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;

namespace CareTogether.Managers
{
    public sealed record CombinedFamilyInfo(Family Family,
        PartneringFamilyInfo? PartneringFamilyInfo, VolunteerFamilyInfo? VolunteerFamilyInfo,
        ImmutableList<Note> Notes, ImmutableList<UploadedDocumentInfo> UploadedDocuments);

    public sealed record PartneringFamilyInfo(
        Referral? OpenReferral,
        ImmutableList<Referral> ClosedReferrals,
        ImmutableList<Activity> History);

    public sealed record Referral(Guid Id,
        DateTime OpenedAtUtc, DateTime? ClosedAtUtc, ReferralCloseReason? CloseReason,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<string> MissingRequirements,
        ImmutableList<CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableList<string> MissingCustomFields,
        ImmutableList<Arrangement> Arrangements,
        string? Comments);

    public sealed record Arrangement(Guid Id, string ArrangementType, Guid PartneringFamilyPersonId,
        ArrangementPhase Phase, DateTime RequestedAtUtc, DateTime? StartedAtUtc, DateTime? EndedAtUtc,
        DateTime? CancelledAtUtc,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<MissingArrangementRequirement> MissingRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableSortedSet<ChildLocationHistoryEntry> ChildLocationHistory,
        string? Comments);

    public sealed record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status);

    public sealed record VolunteerFamilyInfo(
        ImmutableList<CompletedRequirementInfoWithExpiration> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<RemovedRole> RemovedRoles,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleApprovals,
        ImmutableDictionary<Guid, VolunteerInfo> IndividualVolunteers,
        ImmutableList<Activity> History);

    public sealed record VolunteerInfo(
        ImmutableList<CompletedRequirementInfoWithExpiration> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<RemovedRole> RemovedRoles,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleApprovals);
}
