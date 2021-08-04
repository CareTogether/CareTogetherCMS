using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed record VolunteerFamily(Family Family,
        ImmutableList<FormUploadInfo> ApprovalFormUploads,
        ImmutableList<ActivityInfo> ApprovalActivitiesPerformed,
        ImmutableDictionary<string, RoleApprovalStatus> FamilyRoleApprovals,
        ImmutableDictionary<Guid, Volunteer> IndividualVolunteers);

    public sealed record Volunteer(
        ImmutableList<FormUploadInfo> ApprovalFormUploads,
        ImmutableList<ActivityInfo> ApprovalActivitiesPerformed,
        ImmutableDictionary<string, RoleApprovalStatus> IndividualRoleApprovals);


    public interface IApprovalManager
    {
        Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(
            AuthorizedUser user, Guid organizationId, Guid locationId);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command);
    }
}
