using CareTogether.Resources;
using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Directory
{
    [JsonHierarchyBase]
    public abstract partial record DirectoryCommand();
    public sealed record CreateVolunteerFamilyWithNewAdultCommand(
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address Address, PhoneNumber PhoneNumber, EmailAddress EmailAddress)
        : DirectoryCommand;
    public sealed record CreatePartneringFamilyWithNewAdultCommand(DateTime ReferralOpenedAtUtc,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address Address, PhoneNumber PhoneNumber, EmailAddress EmailAddress)
        : DirectoryCommand;
    public sealed record AddAdultToFamilyCommand(Guid FamilyId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address? Address, PhoneNumber? PhoneNumber, EmailAddress? EmailAddress)
        : DirectoryCommand;
    public sealed record AddChildToFamilyCommand(Guid FamilyId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity,
        List<CustodialRelationship> CustodialRelationships,
        string? Concerns, string? Notes)
        : DirectoryCommand;

    public interface IDirectoryManager
    {
        Task<ImmutableList<CombinedFamilyInfo>> ListVisibleFamiliesAsync(
            ClaimsPrincipal user, Guid organizationId, Guid locationId);

        Task<CombinedFamilyInfo> ExecuteDirectoryCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, DirectoryCommand command); //TODO: Replace these with regular FamilyCommand primitives?

        Task<CombinedFamilyInfo> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, FamilyCommand command);

        Task<CombinedFamilyInfo> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command);

        Task<CombinedFamilyInfo> ExecuteNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, NoteCommand command);
    }
}
