using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using JsonPolymorph;

namespace CareTogether.Resources.Directory
{
    public sealed record Family(Guid Id, bool Active, Guid PrimaryFamilyContactPersonId,
        ImmutableList<(Person, FamilyAdultRelationshipInfo)> Adults,
        ImmutableList<Person> Children,
        ImmutableList<CustodialRelationship> CustodialRelationships,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments,
        // COMPATIBILITY: This is included so we don't have to duplicate a delete command for the old approvals document model,
        // and can instead just merge the deletions in the CombinedFamilyInfoFormatter.
        ImmutableList<Guid> DeletedDocuments,
        ImmutableList<CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableList<Activity> History);
    public sealed record Person(Guid Id, bool Active,
        string FirstName, string LastName, Gender? Gender, Age? Age, string? Ethnicity,
        ImmutableList<Address> Addresses, Guid? CurrentAddressId,
        ImmutableList<PhoneNumber> PhoneNumbers, Guid? PreferredPhoneNumberId,
        ImmutableList<EmailAddress> EmailAddresses, Guid? PreferredEmailAddressId,
        string? Concerns, string? Notes);
    public sealed record FamilyAdultRelationshipInfo(
        string RelationshipToFamily, bool IsInHousehold);
    public sealed record CustodialRelationship(
        Guid ChildId, Guid PersonId, CustodialRelationshipType Type);
    public enum CustodialRelationshipType { ParentWithCustody, ParentWithCourtAppointedCustody, LegalGuardian }
    public enum Gender { Male, Female, SeeNotes }
    public sealed record Address(Guid Id,
        string? Line1, string? Line2, string? City, string? County, string? State, string? PostalCode);
    public sealed record PhoneNumber(Guid Id, string Number, PhoneNumberType Type);
    public enum PhoneNumberType { Mobile, Home, Work, Fax }
    public sealed record EmailAddress(Guid Id, string Address, EmailAddressType Type);
    public enum EmailAddressType { Personal, Work }

    [JsonHierarchyBase]
    public abstract partial record Age();
    public sealed record AgeInYears(int Years, DateTime AsOf) : Age;
    public sealed record ExactAge(DateTime DateOfBirth) : Age;

    [JsonHierarchyBase]
    public abstract partial record FamilyCommand(Guid FamilyId);
    public sealed record CreateFamily(Guid FamilyId, Guid PrimaryFamilyContactPersonId,
        ImmutableList<(Guid, FamilyAdultRelationshipInfo)> Adults,
        ImmutableList<Guid> Children,
        ImmutableList<CustodialRelationship> CustodialRelationships)
        : FamilyCommand(FamilyId);
    public sealed record UndoCreateFamily(Guid FamilyId)
        : FamilyCommand(FamilyId);
    public sealed record AddAdultToFamily(Guid FamilyId, Guid AdultPersonId,
        FamilyAdultRelationshipInfo RelationshipToFamily)
        : FamilyCommand(FamilyId);
    public sealed record AddChildToFamily(Guid FamilyId, Guid ChildPersonId,
        ImmutableList<CustodialRelationship> CustodialRelationships)
        : FamilyCommand(FamilyId);
    public sealed record ConvertChildToAdult(Guid FamilyId, Guid PersonId,
        FamilyAdultRelationshipInfo NewRelationshipToFamily)
        : FamilyCommand(FamilyId);
    public sealed record UpdateAdultRelationshipToFamily(Guid FamilyId, Guid AdultPersonId,
        FamilyAdultRelationshipInfo RelationshipToFamily)
        : FamilyCommand(FamilyId);
    public sealed record AddCustodialRelationship(Guid FamilyId,
        CustodialRelationship CustodialRelationship)
        : FamilyCommand(FamilyId);
    public sealed record UpdateCustodialRelationshipType(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);
    public sealed record RemoveCustodialRelationship(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId)
        : FamilyCommand(FamilyId);
    public sealed record UploadFamilyDocument(Guid FamilyId,
        Guid UploadedDocumentId, string UploadedFileName)
        : FamilyCommand(FamilyId);
    public sealed record DeleteUploadedFamilyDocument(Guid FamilyId,
        Guid UploadedDocumentId)
        : FamilyCommand(FamilyId);
    public sealed record ChangePrimaryFamilyContact(Guid FamilyId,
        Guid AdultId)
        : FamilyCommand(FamilyId);
    public sealed record UpdateCustomFamilyField(Guid FamilyId,
        Guid CompletedCustomFieldId, string CustomFieldName, CustomFieldType CustomFieldType, object? Value)
        : FamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record PersonCommand(Guid PersonId);
    public sealed record CreatePerson(Guid PersonId, string FirstName, string LastName,
        Gender? Gender, Age? Age, string? Ethnicity,
        ImmutableList<Address> Addresses, Guid? CurrentAddressId,
        ImmutableList<PhoneNumber> PhoneNumbers, Guid? PreferredPhoneNumberId,
        ImmutableList<EmailAddress> EmailAddresses, Guid? PreferredEmailAddressId,
        string? Concerns, string? Notes)
        : PersonCommand(PersonId);
    public sealed record UndoCreatePerson(Guid PersonId)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonName(Guid PersonId, string FirstName, string LastName)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonGender(Guid PersonId, Gender Gender)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonAge(Guid PersonId, Age Age)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonEthnicity(Guid PersonId, string Ethnicity)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonConcerns(Guid PersonId, string? Concerns)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonNotes(Guid PersonId, string? Notes)
        : PersonCommand(PersonId);
    public sealed record AddPersonAddress(Guid PersonId, Address Address, bool IsCurrentAddress)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonAddress(Guid PersonId, Address Address, bool IsCurrentAddress)
        : PersonCommand(PersonId);
    public sealed record AddPersonPhoneNumber(Guid PersonId, PhoneNumber PhoneNumber, bool IsPreferredPhoneNumber)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonPhoneNumber(Guid PersonId, PhoneNumber PhoneNumber, bool IsPreferredPhoneNumber)
        : PersonCommand(PersonId);
    public sealed record AddPersonEmailAddress(Guid PersonId, EmailAddress EmailAddress, bool IsPreferredEmailAddress)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonEmailAddress(Guid PersonId, EmailAddress EmailAddress, bool IsPreferredEmailAddress)
        : PersonCommand(PersonId);

    /// <summary>
    /// The <see cref="IDirectoryResource"/> is responsible for the "contact list" aspects of CareTogether.
    /// The directory includes information about people, the families they are a part of, and their contact information.
    /// </summary>
    public interface IDirectoryResource
    {
        Task<ImmutableList<Person>> ListPeopleAsync(Guid organizationId, Guid locationId);

        Task<Family?> FindFamilyAsync(Guid organizationId, Guid locationId, Guid familyId);

        Task<Family?> FindPersonFamilyAsync(Guid organizationId, Guid locationId, Guid personId);

        Task<ImmutableList<Family>> ListFamiliesAsync(Guid organizationId, Guid locationId);

        Task<Family> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command, Guid userId);

        Task<Person> ExecutePersonCommandAsync(Guid organizationId, Guid locationId, PersonCommand command, Guid userId);

        Task<Uri> GetFamilyDocumentReadValetUrl(Guid organizationId, Guid locationId, Guid familyId, Guid documentId);

        //TODO: Rename to 'UploadFamilyDocumentViaValetUrl' and merge in FamilyCommand functionality to ensure consistency
        Task<Uri> GetFamilyDocumentUploadValetUrl(Guid organizationId, Guid locationId, Guid familyId, Guid documentId);
    }
}
