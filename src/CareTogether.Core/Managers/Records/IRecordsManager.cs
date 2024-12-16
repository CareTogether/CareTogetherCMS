using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using JsonPolymorph;

namespace CareTogether.Managers.Records
{
    [JsonHierarchyBase]
    public abstract partial record CompositeRecordsCommand(Guid FamilyId);

    public sealed record CreateVolunteerFamilyWithNewAdultCommand(
        Guid FamilyId,
        Guid PersonId,
        string FirstName,
        string LastName,
        Gender? Gender,
        Age? Age,
        string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo,
        string? Concerns,
        string? Notes,
        Address? Address,
        PhoneNumber? PhoneNumber,
        EmailAddress? EmailAddress
    ) : CompositeRecordsCommand(FamilyId);

    public sealed record CreatePartneringFamilyWithNewAdultCommand(
        Guid FamilyId,
        Guid PersonId,
        Guid ReferralId,
        DateTime ReferralOpenedAtUtc,
        string FirstName,
        string LastName,
        Gender? Gender,
        Age? Age,
        string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo,
        string? Concerns,
        string? Notes,
        Address? Address,
        PhoneNumber? PhoneNumber,
        EmailAddress? EmailAddress
    ) : CompositeRecordsCommand(FamilyId);

    public sealed record AddAdultToFamilyCommand(
        Guid FamilyId,
        Guid PersonId,
        string FirstName,
        string LastName,
        Gender? Gender,
        Age? Age,
        string? Ethnicity,
        FamilyAdultRelationshipInfo FamilyAdultRelationshipInfo,
        string? Concerns,
        string? Notes,
        Address? Address,
        PhoneNumber? PhoneNumber,
        EmailAddress? EmailAddress
    ) : CompositeRecordsCommand(FamilyId);

    public sealed record AddChildToFamilyCommand(
        Guid FamilyId,
        Guid PersonId,
        string FirstName,
        string LastName,
        Gender? Gender,
        Age? Age,
        string? Ethnicity,
        List<CustodialRelationship> CustodialRelationships,
        string? Concerns,
        string? Notes
    ) : CompositeRecordsCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record AtomicRecordsCommand();

    public sealed record FamilyRecordsCommand(FamilyCommand Command) : AtomicRecordsCommand();

    public sealed record PersonRecordsCommand(Guid FamilyId, PersonCommand Command) : AtomicRecordsCommand();

    public sealed record FamilyApprovalRecordsCommand(VolunteerFamilyCommand Command) : AtomicRecordsCommand();

    public sealed record IndividualApprovalRecordsCommand(VolunteerCommand Command) : AtomicRecordsCommand();

    public sealed record ReferralRecordsCommand(ReferralCommand Command) : AtomicRecordsCommand();

    public sealed record ArrangementRecordsCommand(ArrangementsCommand Command) : AtomicRecordsCommand();

    public sealed record NoteRecordsCommand(NoteCommand Command) : AtomicRecordsCommand();

    public sealed record CommunityRecordsCommand(CommunityCommand Command) : AtomicRecordsCommand();

    [JsonHierarchyBase]
    public abstract partial record RecordsAggregate(Guid Id);

    public sealed record FamilyRecordsAggregate(CombinedFamilyInfo Family) : RecordsAggregate(Family.Family.Id);

    public sealed record CommunityRecordsAggregate(CommunityInfo Community) : RecordsAggregate(Community.Community.Id);

    public interface IRecordsManager
    {
        Task<ImmutableList<RecordsAggregate>> ListVisibleAggregatesAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        );

        //TODO: Support returning *multiple* aggregates to upsert
        Task<RecordsAggregate?> ExecuteCompositeRecordsCommand(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CompositeRecordsCommand command
        );

        //TODO: Support returning *multiple* aggregates to upsert
        Task<RecordsAggregate?> ExecuteAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        );

        Task<Uri> GetFamilyDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            Guid documentId
        );

        Task<Uri> GenerateFamilyDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            Guid documentId
        );

        Task<Uri> GetCommunityDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid communityId,
            Guid documentId
        );

        Task<Uri> GenerateCommunityDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid communityId,
            Guid documentId
        );
    }
}
