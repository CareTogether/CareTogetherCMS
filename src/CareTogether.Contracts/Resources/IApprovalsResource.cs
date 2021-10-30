using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public record VolunteerFamilyEntry(Guid FamilyId,
        VolunteerFamilyStatus Status, string Note,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableDictionary<Guid, VolunteerEntry> IndividualEntries);

    public enum VolunteerFamilyStatus { Active, Inactive }

    public record VolunteerEntry(Guid PersonId,
        bool Active, string Note,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements);

    public enum RoleApprovalStatus { Prospective, Approved, Onboarded };

    [JsonHierarchyBase]
    public abstract partial record VolunteerFamilyCommand(Guid FamilyId);
    public sealed record CompleteVolunteerFamilyRequirement(Guid FamilyId,
        string RequirementName, DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record UploadVolunteerFamilyDocument(Guid FamilyId,
        Guid UploadedDocumentId, string UploadedFileName)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record DeactivateVolunteerFamily(Guid FamilyId,
        string Reason)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record ActivateVolunteerFamily(Guid FamilyId)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record SetVolunteerFamilyNote(Guid FamilyId,
        string Note)
        : VolunteerFamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record VolunteerCommand(Guid FamilyId, Guid PersonId);
    public sealed record CompleteVolunteerRequirement(Guid FamilyId, Guid PersonId,
        string RequirementName,  DateTime CompletedAtUtc, Guid? UploadedDocumentId)
        : VolunteerCommand(FamilyId, PersonId);
    public sealed record DeactivateVolunteer(Guid FamilyId, Guid PersonId,
        string Reason) : VolunteerCommand(FamilyId, PersonId);
    public sealed record ReactivateVolunteer(Guid FamilyId, Guid PersonId)
        : VolunteerCommand(FamilyId, PersonId);
    public sealed record SetVolunteerNote(Guid FamilyId, Guid PersonId,
        string Note) : VolunteerCommand(FamilyId, PersonId);

    /// <summary>
    /// The <see cref="IApprovalsResource"/> models the lifecycle of people's approval status with CareTogether organizations,
    /// including various forms, approval, renewals, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IApprovalsResource
    {
        Task<ImmutableList<VolunteerFamilyEntry>> ListVolunteerFamiliesAsync(Guid organizationId, Guid locationId);

        Task<VolunteerFamilyEntry> GetVolunteerFamilyAsync(Guid organizationId, Guid locationId, Guid familyId);

        Task<VolunteerFamilyEntry> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyCommand command, Guid userId);

        Task<VolunteerFamilyEntry> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            VolunteerCommand command, Guid userId);
    }
}
