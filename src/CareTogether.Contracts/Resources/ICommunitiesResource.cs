using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record Family(Guid Id,
        List<(Person, FamilyAdultRelationshipInfo)> Adults,
        List<Person> Children,
        List<CustodialRelationship> CustodialRelationships);
    public sealed record Person(Guid Id, Guid? UserId,
        string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity);
    public sealed record FamilyAdultRelationshipInfo(
        string RelationshipToFamily, string Notes,
        bool IsInHousehold, bool IsPrimaryFamilyContact, string Concerns);
    public sealed record CustodialRelationship(
        Guid ChildId, Guid PersonId, CustodialRelationshipType Type);
    public enum CustodialRelationshipType { ParentWithCustody, ParentWithCourtAppointedCustody, LegalGuardian }
    public enum Gender { Male, Female, SeeNotes }

    [JsonHierarchyBase]
    public abstract partial record Age();
    public sealed record AgeInYears(int Years, DateTime AsOf) : Age;
    public sealed record ExactAge(DateTime DateOfBirth) : Age;

    [JsonHierarchyBase]
    public abstract partial record FamilyCommand(Guid FamilyId);
    public sealed record CreateFamily(Guid FamilyId,
        List<(Guid, FamilyAdultRelationshipInfo)> Adults,
        List<Guid> Children,
        List<CustodialRelationship> CustodialRelationships)
        : FamilyCommand(FamilyId);
    public sealed record AddAdultToFamily(Guid FamilyId, Guid AdultPersonId,
        FamilyAdultRelationshipInfo RelationshipToFamily)
        : FamilyCommand(FamilyId);
    public sealed record AddChildToFamily(Guid FamilyId, Guid ChildPersonId,
        List<CustodialRelationship> CustodialRelationships)
        : FamilyCommand(FamilyId);
    public sealed record UpdateAdultRelationshipToFamily(Guid FamilyId, Guid AdultPersonId,
        FamilyAdultRelationshipInfo RelationshipToFamily)
        : FamilyCommand(FamilyId);
    public sealed record AddCustodialRelationship(Guid FamilyId, //TODO: This should just take a CustodialRelationship
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);
    public sealed record UpdateCustodialRelationshipType(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);
    public sealed record RemoveCustodialRelationship(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId)
        : FamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record PersonCommand(Guid PersonId);
    public sealed record CreatePerson(Guid PersonId, Guid? UserId, string FirstName, string LastName,
        Gender Gender, Age Age, string Ethnicity)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonName(Guid PersonId, string FirstName, string LastName)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonAge(Guid PersonId, Age Age)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonUserLink(Guid PersonId, Guid? UserId)
        : PersonCommand(PersonId);

    /// <summary>
    /// The <see cref="ICommunitiesResource"/> is responsible for the "social networking" aspects of CareTogether.
    /// The social graph consists of stable points (people, families of adults and children in various relationships),
    /// transient groups such as churches and circles of support (that are only linked to each other through the
    /// people who currently comprise those groups), and touchpoints between people.
    /// </summary>
    public interface ICommunitiesResource
    {
        Task<ResourceResult<Person>> FindUserAsync(Guid organizationId, Guid locationId, Guid userId);

        Task<ImmutableList<Person>> ListPeopleAsync(Guid organizationId, Guid locationId);

        Task<ResourceResult<Family>> FindFamilyAsync(Guid organizationId, Guid locationId, Guid familyId);

        Task<ImmutableList<Family>> ListFamiliesAsync(Guid organizationId, Guid locationId);

        Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command, Guid userId);

        Task<ResourceResult<Person>> ExecutePersonCommandAsync(Guid organizationId, Guid locationId, PersonCommand command, Guid userId);
    }
}
