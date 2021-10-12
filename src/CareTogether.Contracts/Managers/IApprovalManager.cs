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
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<(string Role, string Version), RoleApprovalStatus> FamilyRoleApprovals,
        ImmutableDictionary<Guid, Volunteer> IndividualVolunteers,
        ImmutableDictionary<Guid, ContactInfo> ContactInfo);

    public sealed record Volunteer(
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<string> MissingRequirements,
        ImmutableList<string> AvailableApplications,
        ImmutableDictionary<(string Role, string Version), RoleApprovalStatus> IndividualRoleApprovals);

    [JsonHierarchyBase]
    public abstract partial record ApprovalCommand();
    public sealed record CreateVolunteerFamilyWithNewAdultCommand(
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address Address, PhoneNumber PhoneNumber, EmailAddress EmailAddress)
        : ApprovalCommand;
    public sealed record AddAdultToFamilyCommand(Guid FamilyId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address? Address, PhoneNumber? PhoneNumber, EmailAddress? EmailAddress)
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

        Task<VolunteerFamily> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<VolunteerFamily> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);

        Task<VolunteerFamily> ExecuteApprovalCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ApprovalCommand command);

        Task<VolunteerFamily> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command);
    }
}
