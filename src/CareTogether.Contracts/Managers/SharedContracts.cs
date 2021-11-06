using CareTogether.Engines;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;

namespace CareTogether.Managers
{
    public sealed record CombinedFamilyInfo(Family Family,
        PartneringFamilyInfo? PartneringFamilyInfo, VolunteerFamilyInfo? VolunteerFamilyInfo);

    public sealed record PartneringFamilyInfo(
        Referral? OpenReferral,
        ImmutableList<Referral> ClosedReferrals);

    public sealed record Referral(Guid Id,
        DateTime CreatedUtc, ReferralCloseReason? CloseReason,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingRequirements,
        ImmutableList<Arrangement> Arrangements);

    public sealed record Arrangement(Guid Id, string ArrangementType,
        ArrangementState State,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableList<PartneringFamilyChildAssignment> PartneringFamilyChildAssignments,
        ImmutableList<ChildLocationHistoryEntry> ChildrenLocationHistory,
        ImmutableList<Note> Notes);

    public sealed record Note(Guid Id, Guid AuthorId, DateTime TimestampUtc,
        string? Contents, NoteStatus Status);

    public sealed record VolunteerFamilyInfo(
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<RemovedRole> RemovedRoles,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> FamilyRoleApprovals,
        ImmutableDictionary<Guid, VolunteerInfo> IndividualVolunteers);

    public sealed record VolunteerInfo(
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<RemovedRole> RemovedRoles,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<string, ImmutableList<RoleVersionApproval>> IndividualRoleApprovals);
}
