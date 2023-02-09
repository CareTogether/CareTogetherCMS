using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Records
{
    [JsonHierarchyBase]
    public abstract partial record CompositeRecordsCommand(Guid FamilyId);
    public sealed record CreateVolunteerFamilyWithNewAdultCommand(Guid FamilyId, Guid PersonId,
        string FirstName, string LastName, Gender? Gender, Age? Age, string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address? Address, PhoneNumber? PhoneNumber, EmailAddress? EmailAddress)
        : CompositeRecordsCommand(FamilyId);
    public sealed record CreatePartneringFamilyWithNewAdultCommand(Guid FamilyId, Guid PersonId,
        Guid ReferralId, DateTime ReferralOpenedAtUtc,
        string FirstName, string LastName, Gender? Gender, Age? Age, string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address? Address, PhoneNumber? PhoneNumber, EmailAddress? EmailAddress)
        : CompositeRecordsCommand(FamilyId);
    public sealed record AddAdultToFamilyCommand(Guid FamilyId, Guid PersonId,
        string FirstName, string LastName, Gender? Gender, Age? Age, string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo, string? Concerns, string? Notes,
        Address? Address, PhoneNumber? PhoneNumber, EmailAddress? EmailAddress)
        : CompositeRecordsCommand(FamilyId);
    public sealed record AddChildToFamilyCommand(Guid FamilyId, Guid PersonId,
        string FirstName, string LastName, Gender? Gender, Age? Age, string? Ethnicity,
        List<CustodialRelationship> CustodialRelationships,
        string? Concerns, string? Notes)
        : CompositeRecordsCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record AtomicRecordsCommand();
    public sealed record FamilyRecordsCommand(FamilyCommand Command)
        : AtomicRecordsCommand();
    public sealed record PersonRecordsCommand(Guid FamilyId, PersonCommand Command)
        : AtomicRecordsCommand();
    public sealed record FamilyApprovalRecordsCommand(VolunteerFamilyCommand Command)
        : AtomicRecordsCommand();
    public sealed record IndividualApprovalRecordsCommand(VolunteerCommand Command)
        : AtomicRecordsCommand();
    public sealed record ReferralRecordsCommand(ReferralCommand Command)
        : AtomicRecordsCommand();
    public sealed record ArrangementRecordsCommand(ArrangementsCommand Command)
        : AtomicRecordsCommand();
    public sealed record NoteRecordsCommand(NoteCommand Command)
        : AtomicRecordsCommand();

    public interface IRecordsManager
    {
        Task<ImmutableList<CombinedFamilyInfo>> ListVisibleFamiliesAsync(
            ClaimsPrincipal user, Guid organizationId, Guid locationId);

        Task<CombinedFamilyInfo> ExecuteCompositeRecordsCommand(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, CompositeRecordsCommand command);

        //TODO: When adding the CommunityRecordsCommand, the return type of this method will need to be updated to
        //      an abstract "ScopedCommandResult" that can be either "FamilyScopedCommandResult" of "CombinedFamilyInfo"
        //      or "CommunityScopedCommandResult" of "CommunityInfo" (and potentially other scope types as well, e.g. settings).
        Task<CombinedFamilyInfo> ExecuteAtomicRecordsCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, AtomicRecordsCommand command);
    }
}
