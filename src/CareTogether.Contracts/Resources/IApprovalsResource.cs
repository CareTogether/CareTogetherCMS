using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public record VolunteerFamilyEntry(Guid FamilyId,
        bool Active, string Note,
        ImmutableList<FormUploadInfo> ApprovalFormUploads,
        ImmutableList<ActivityInfo> ApprovalActivitiesPerformed,
        ImmutableDictionary<Guid, VolunteerEntry> IndividualEntries);

    public record VolunteerEntry(Guid PersonId,
        bool Active, string Note,
        ImmutableList<FormUploadInfo> ApprovalFormUploads,
        ImmutableList<ActivityInfo> ApprovalActivitiesPerformed);

    public enum RoleApprovalStatus { Prospective, Approved };

    [JsonHierarchyBase]
    public abstract partial record VolunteerFamilyCommand(Guid FamilyId);
    public sealed record PerformVolunteerFamilyActivity(Guid FamilyId, string ActivityName)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record UploadVolunteerFamilyForm(Guid FamilyId,
        string FormName, string FormVersion, string UploadedFileName)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record DeactivateVolunteerFamily(Guid FamilyId,
        string Reason)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record ReactivateVolunteerFamily(Guid FamilyId)
        : VolunteerFamilyCommand(FamilyId);
    public sealed record SetVolunteerFamilyNote(Guid FamilyId,
        string Note)
        : VolunteerFamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record VolunteerCommand(Guid FamilyId, Guid PersonId);
    public sealed record PerformVolunteerActivity(Guid FamilyId, Guid PersonId,
        string ActivityName) : VolunteerCommand(FamilyId, PersonId);
    public sealed record UploadVolunteerForm(Guid FamilyId, Guid PersonId,
        string FormName, string FormVersion, string UploadedFileName)
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

        Task<ResourceResult<VolunteerFamilyEntry>> GetVolunteerFamilyAsync(Guid organizationId, Guid locationId, Guid familyId);

        Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyCommand command, Guid userId);

        Task<ResourceResult<VolunteerFamilyEntry>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            VolunteerCommand command, Guid userId);
    }
}
