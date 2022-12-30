using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using CareTogether.Utilities.Telephony;
using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Records
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

    [JsonHierarchyBase]
    public abstract partial record RecordsCommand();
    public sealed record FamilyRecordsCommand(FamilyCommand Command)
        : RecordsCommand();
    public sealed record PersonRecordsCommand(Guid FamilyId, PersonCommand Command)
        : RecordsCommand();
    public sealed record FamilyApprovalRecordsCommand(VolunteerFamilyCommand Command)
        : RecordsCommand();
    public sealed record IndividualApprovalRecordsCommand(VolunteerCommand Command)
        : RecordsCommand();
    public sealed record ReferralRecordsCommand(ReferralCommand Command)
        : RecordsCommand();
    public sealed record ArrangementRecordsCommand(ArrangementsCommand Command)
        : RecordsCommand();
    public sealed record NoteRecordsCommand(NoteCommand Command)
        : RecordsCommand();

    public interface IRecordsManager
    {
        Task<ImmutableList<CombinedFamilyInfo>> ListVisibleFamiliesAsync(
            ClaimsPrincipal user, Guid organizationId, Guid locationId);

        Task<CombinedFamilyInfo> ExecuteDirectoryCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, DirectoryCommand command); //TODO: Replace these with regular FamilyCommand primitives?

        Task<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>> SendSmsToFamilyPrimaryContactsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user,
            ImmutableList<Guid> familyIds, string sourceNumber, string message);

        Task<CombinedFamilyInfo> ExecuteRecordsCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, RecordsCommand command);
    }
}
