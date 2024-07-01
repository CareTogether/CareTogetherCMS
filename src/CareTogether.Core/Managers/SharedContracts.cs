using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;

namespace CareTogether.Managers
{
    public sealed record CombinedFamilyInfo(Family Family,
        ImmutableList<UserInfo> Users,
        PartneringFamilyInfo? PartneringFamilyInfo, VolunteerFamilyInfo? VolunteerFamilyInfo,
        ImmutableList<Note> Notes, ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingCustomFields, //TODO: Include community memberships & community role assignments?
        ImmutableList<Permission> UserPermissions);

    public sealed record UserInfo(Guid? UserId, Guid PersonId, ImmutableList<string> LocationRoles);

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
        DateTime? CancelledAtUtc, DateTime? PlannedStartUtc, DateTime? PlannedEndUtc,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<MissingArrangementRequirement> MissingRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableSortedSet<ChildLocationHistoryEntry> ChildLocationHistory,
        ImmutableSortedSet<ChildLocationHistoryEntry> ChildLocationPlan,
        string? Comments, string? Reason);

    public sealed record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status, DateTime? BackdatedTimestampUtc);

    public sealed record VolunteerFamilyInfo(
        ImmutableDictionary<string, FamilyRoleApprovalStatus> FamilyRoleApprovals,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableList<string> MissingRequirements,
        ImmutableList<RoleRemoval> RoleRemovals,
        ImmutableDictionary<Guid, VolunteerInfo> IndividualVolunteers,
        ImmutableList<Activity> History);

    public sealed record VolunteerInfo(
        ImmutableDictionary<string, IndividualRoleApprovalStatus> ApprovalStatusByRole,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableList<(string ActionName, string? Version)> MissingRequirements,
        ImmutableList<RoleRemoval> RoleRemovals);

    public sealed record CommunityInfo(Community Community,
        ImmutableList<Permission> UserPermissions);
}
