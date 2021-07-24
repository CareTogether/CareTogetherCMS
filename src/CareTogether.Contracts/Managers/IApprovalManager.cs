using CareTogether.Resources;
using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed record VolunteerFamily(Family Family,
        ImmutableList<(string, VolunteerRoleApprovalStatus)> FamilyRoleApprovals,
        ImmutableDictionary<Guid, ImmutableList<(string, VolunteerRoleApprovalStatus)>> IndividualRoleApprovals);

    public enum VolunteerRoleApprovalStatus { Prospective, Approved, Denied, Expired };


    [JsonHierarchyBase]
    public abstract partial record VolunteerFamilyCommand(Guid FamilyId, Guid UserId, DateTime TimestampUtc);
    public sealed record PerformVolunteerFamilyActivity(Guid FamilyId, Guid UserId, DateTime TimestampUtc,
        string ActivityName)
        : VolunteerFamilyCommand(FamilyId, UserId, TimestampUtc);
    public sealed record UploadVolunteerFamilyForm(Guid FamilyId, Guid UserId, DateTime TimestampUtc,
        string FormName, string FormVersion, string UploadedFileName)
        : VolunteerFamilyCommand(FamilyId, UserId, TimestampUtc);
    public sealed record DeactivateVolunteerFamily(Guid FamilyId, Guid UserId, DateTime TimestampUtc,
        string Reason)
        : VolunteerFamilyCommand(FamilyId, UserId, TimestampUtc);
    public sealed record ReactivateVolunteerFamily(Guid FamilyId, Guid UserId, DateTime TimestampUtc)
        : VolunteerFamilyCommand(FamilyId, UserId, TimestampUtc);
    public sealed record SetVolunteerFamilyNote(Guid FamilyId, Guid UserId, DateTime TimestampUtc,
        string Note)
        : VolunteerFamilyCommand(FamilyId, UserId, TimestampUtc);

    [JsonHierarchyBase]
    public abstract partial record VolunteerCommand(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc);
    public sealed record PerformVolunteerActivity(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc,
        string ActivityName)
        : VolunteerCommand(FamilyId, PersonId, UserId, TimestampUtc);
    public sealed record UploadVolunteerForm(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc,
        string FormName, string FormVersion, string UploadedFileName)
        : VolunteerCommand(FamilyId, PersonId, UserId, TimestampUtc);
    public sealed record DeactivateVolunteer(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc,
        string Reason)
        : VolunteerCommand(FamilyId, PersonId, UserId, TimestampUtc);
    public sealed record ReactivateVolunteer(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc)
        : VolunteerCommand(FamilyId, PersonId, UserId, TimestampUtc);
    public sealed record SetVolunteerNote(Guid FamilyId, Guid PersonId, Guid UserId, DateTime TimestampUtc,
        string Note)
        : VolunteerCommand(FamilyId, PersonId, UserId, TimestampUtc);

    /// <summary>
    /// The <see cref="IApprovalManager"/> models the lifecycle of people's approval status with CareTogether organizations,
    /// including various forms, approval, renewals, and policy changes, as well as authorizing related queries.
    /// </summary>
    public interface IApprovalManager
    {
        Task<IImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(
            AuthorizedUser user, Guid organizationId, Guid locationId);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command);
    }
}
