using CareTogether.Resources;
using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
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

    [JsonHierarchyBase]
    public abstract partial record ApprovalCommand();
    public sealed record CreateVolunteerFamilyWithNewAdultCommand(
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes)
        : ApprovalCommand;
    public sealed record AddAdultToFamilyCommand(Guid FamilyId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes)
        : ApprovalCommand;
    public sealed record AddChildToFamilyCommand(Guid FamilyId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        List<CustodialRelationship> CustodialRelationships,
        string? Concerns, string? Notes)
        : ApprovalCommand;

    public interface IApprovalManager
    {
        Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(
            ClaimsPrincipal user, Guid organizationId, Guid locationId);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecuteApprovalCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ApprovalCommand command);

        Task<ManagerResult<VolunteerFamily>> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command);
    }
}
