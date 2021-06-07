using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record Family(Guid Id,
        List<FamilyAdult> Adults, List<FamilyChild> Children, FamilyType Type);
    public enum FamilyType { PartneringFamily, VolunteerFamily }

    [JsonHierarchyBase]
    public partial record Person(Guid Id, Guid? UserId,
        string FirstName, string LastName, Age Age);
    public sealed record FamilyAdult(Guid Id, Guid? UserId,
        string FirstName, string LastName, Age Age,
        AdultFamilyRelationship RelationshipToFamily, string FamilyRelationshipNotes,
        bool IsInHousehold, bool IsPrimaryFamilyContact, string SafetyRiskNotes)
        : Person(Id, UserId, FirstName, LastName, Age);
    public sealed record FamilyChild(Guid Id,
        string FirstName, string LastName, Age Age,
        ChildCustodialRelationship[] CustodialRelationships) :
        Person(Id, Guid.Empty, FirstName, LastName, Age);
    public enum AdultFamilyRelationship { Dad, Mom, Relative, Friend, DomesticWorker };
    public sealed record ChildCustodialRelationship(Guid AdultId, CustodialRelationshipType Type);
    public enum CustodialRelationshipType { ParentWithCustody, ParentWithCourtAppointedCustody, LegalGuardian }

    [JsonHierarchyBase]
    public abstract partial record Age();
    public sealed record AgeInYears(byte Years, DateTime AsOf) : Age;
    public sealed record ExactAge(DateTime DateOfBirth) : Age;

    [JsonHierarchyBase]
    public abstract partial record FamilyCommand(Guid FamilyId);
    public sealed record CreateFamily(Guid[] AdultPersonIds, Guid[] ChildPersonIds,
        ChildCustodialRelationship[] CustodialRelationships, FamilyType Type)
        : FamilyCommand(Guid.Empty);
    public sealed record AddAdultToFamily(Guid FamilyId, Guid[] AdultPersonId)
        : FamilyCommand(FamilyId);
    public sealed record AddChildToFamily(Guid FamilyId, Guid[] ChildPersonId,
        ChildCustodialRelationship[] CustodialRelationships)
        : FamilyCommand(FamilyId);
    public sealed record UpdateAdultRelationshipToFamily(Guid FamilyId, Guid AdultPersonId,
        AdultFamilyRelationship RelationshipToFamily, string FamilyRelationshipNotes,
        bool IsInHousehold, bool IsPrimaryFamilyContact)
        : FamilyCommand(FamilyId);
    public sealed record UpdateAdultSafetyRiskNotes(Guid FamilyId, Guid AdultPersonId,
        string SafetyRiskNotes) : FamilyCommand(FamilyId);
    public sealed record AddCustodialRelationship(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);
    public sealed record UpdateCustodialRelationship(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);
    public sealed record RemoveCustodialRelationship(Guid FamilyId,
        Guid ChildPersonId, Guid AdultPersonId, CustodialRelationshipType Type)
        : FamilyCommand(FamilyId);

    [JsonHierarchyBase]
    public abstract partial record PersonCommand(Guid FamilyId);
    public sealed record CreatePerson(Guid? UserId, string FirstName, string LastName, Age Age)
        : PersonCommand(Guid.Empty);
    public sealed record UpdatePersonName(Guid PersonId, string FirstName, string LastName)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonAge(Guid PersonId, Age Age)
        : PersonCommand(PersonId);
    public sealed record UpdatePersonUserLink(Guid ContactId, Guid UserId)
        : PersonCommand(ContactId);

    /// <summary>
    /// The <see cref="ICommunitiesResource"/> is responsible for the "social networking" aspects of CareTogether.
    /// The social graph consists of stable points (people, families of adults and children in various relationships),
    /// transient groups such as churches and circles of support (that are only linked to each other through the
    /// people who currently comprise those groups), and touchpoints between people.
    /// </summary>
    public interface ICommunitiesResource
    {
        Task<Person> FindUserAsync(Guid organizationId, Guid locationId, Guid userId);

        IAsyncEnumerable<Person> FindPeopleByPartialName(Guid organizationId, Guid locationId, string searchQuery);

        IQueryable<Family> QueryFamilies(Guid organizationId, Guid locationId);

        IQueryable<Person> QueryPeople(Guid organizationId, Guid locationId);

        Task<Family> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command);

        Task<Person> ExecutePersonCommandAsync(Guid organizationId, Guid locationId, PersonCommand command);
    }
}
