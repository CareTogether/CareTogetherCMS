using JsonPolymorph;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    [JsonHierarchyBase]
    public abstract partial record CommunityEvent();
    public sealed record FamilyCommandExecuted(FamilyCommand Command) : CommunityEvent;
    public sealed record PersonCommandExecuted(PersonCommand Command) : CommunityEvent;

    public sealed class CommunityModel
    {
        internal record FamilyEntry(Guid Id,
            PartneringFamilyStatus? PartneringFamilyStatus, VolunteerFamilyStatus? VolunteerFamilyStatus,
            ImmutableDictionary<Guid, FamilyAdultRelationshipInfo> AdultRelationships,
            ImmutableList<Guid> Children,
            ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType> CustodialRelationships)
        {
            internal Family ToFamily(IImmutableDictionary<Guid, PersonEntry> people) =>
                new(Id, VolunteerFamilyStatus, PartneringFamilyStatus,
                    AdultRelationships.Select(ar => (people[ar.Key].ToPerson(), ar.Value)).ToList(),
                    Children.Select(c => people[c].ToPerson()).ToList(),
                    CustodialRelationships.Select(cr => new CustodialRelationship(cr.Key.ChildId, cr.Key.AdultId, cr.Value)).ToList());
        }

        internal record PersonEntry(Guid Id, Guid? UserId, string FirstName, string LastName, Age Age)
        {
            internal Person ToPerson() =>
                new(Id, UserId, FirstName, LastName, Age);
        }


        private ImmutableDictionary<Guid, PersonEntry> people = ImmutableDictionary<Guid, PersonEntry>.Empty;
        private ImmutableDictionary<Guid, FamilyEntry> families = ImmutableDictionary<Guid, FamilyEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<CommunityModel> InitializeAsync(
            IAsyncEnumerable<(CommunityEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new CommunityModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public OneOf<Success<(FamilyCommandExecuted Event, long SequenceNumber, Family Family, Action OnCommit)>, Error<string>>
            ExecuteFamilyCommand(FamilyCommand command)
        {
            OneOf<FamilyEntry, Error<string>> result = command switch
            {
                CreateFamily c => new FamilyEntry(c.FamilyId, c.PartneringFamilyStatus, c.VolunteerFamilyStatus,
                    AdultRelationships: ImmutableDictionary<Guid, FamilyAdultRelationshipInfo>.Empty.AddRange(
                        c.Adults?.Select(a => new KeyValuePair<Guid, FamilyAdultRelationshipInfo>(a.Item1, a.Item2))
                        ?? new List<KeyValuePair<Guid, FamilyAdultRelationshipInfo>>()),
                    Children: ImmutableList<Guid>.Empty.AddRange(c.Children ?? new List<Guid>()),
                    CustodialRelationships: ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType>.Empty.AddRange(
                        c.CustodialRelationships?.Select(cr =>
                            new KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>((cr.ChildId, cr.PersonId), cr.Type))
                        ?? new List<KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>>())),
                _ => families.TryGetValue(command.FamilyId, out var familyEntry)
                    ? command switch
                    {
                        //TODO: Error if key already exists
                        //TODO: Error if person is not found
                        AddAdultToFamily c => familyEntry with
                        {
                            AdultRelationships = familyEntry.AdultRelationships.Add(c.AdultPersonId, c.RelationshipToFamily)
                        },
                        //TODO: Error if key already exists
                        //TODO: Error if person is not found
                        AddChildToFamily c => familyEntry with
                        {
                            Children = familyEntry.Children.Add(c.ChildPersonId),
                            CustodialRelationships = familyEntry.CustodialRelationships.AddRange(c.CustodialRelationships.Select(cr =>
                                new KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>((cr.ChildId, cr.PersonId), cr.Type)))
                        },
                        //TODO: Error if key is not found
                        UpdateAdultRelationshipToFamily c => familyEntry with
                        {
                            AdultRelationships = familyEntry.AdultRelationships.SetItem(c.AdultPersonId, c.RelationshipToFamily)
                        },
                        //TODO: Error if adult is not found
                        //TODO: Error if child is not found
                        AddCustodialRelationship c => familyEntry with
                        {
                            CustodialRelationships = familyEntry.CustodialRelationships.Add((c.ChildPersonId, c.AdultPersonId), c.Type)
                        },
                        //TODO: Error if key is not found
                        UpdateCustodialRelationshipType c => familyEntry with
                        {
                            CustodialRelationships = familyEntry.CustodialRelationships.SetItem((c.ChildPersonId, c.AdultPersonId), c.Type)
                        },
                        //TODO: Error if key is not found
                        RemoveCustodialRelationship c => familyEntry with
                        {
                            CustodialRelationships = familyEntry.CustodialRelationships.Remove((c.ChildPersonId, c.AdultPersonId))
                        },
                        UpdatePartneringFamilyStatus c => familyEntry with { PartneringFamilyStatus = c.PartneringFamilyStatus },
                        UpdateVolunteerFamilyStatus c => familyEntry with { VolunteerFamilyStatus = c.VolunteerFamilyStatus },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("A family with the specified ID does not exist.")
            };
            if (result.TryPickT0(out var familyEntryToUpsert, out var error))
                return new Success<(FamilyCommandExecuted Event, long SequenceNumber, Family Family, Action OnCommit)>((
                    Event: new FamilyCommandExecuted(command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    Family: familyEntryToUpsert.ToFamily(people),
                    OnCommit: () => families = families.SetItem(familyEntryToUpsert.Id, familyEntryToUpsert)));
            else
                return result.AsT1;
        }

        public OneOf<Success<(PersonCommandExecuted Event, long SequenceNumber, Person Person, Action OnCommit)>, Error<string>>
            ExecutePersonCommand(PersonCommand command)
        {
            OneOf<PersonEntry, Error<string>> result = command switch
            {
                CreatePerson c => new PersonEntry(c.PersonId, c.UserId, c.FirstName, c.LastName, c.Age),
                _ => people.TryGetValue(command.PersonId, out var personEntry)
                    ? command switch
                    {
                        UpdatePersonName c => personEntry with { FirstName = c.FirstName, LastName = c.LastName },
                        UpdatePersonAge c => personEntry with { Age = c.Age },
                        UpdatePersonUserLink c => personEntry with { UserId = c.UserId },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("A person with the specified ID does not exist.")
            };
            if (result.TryPickT0(out var personEntryToUpsert, out var error))
                return new Success<(PersonCommandExecuted Event, long SequenceNumber, Person Person, Action OnCommit)>((
                    Event: new PersonCommandExecuted(command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    Person: personEntryToUpsert.ToPerson(),
                    OnCommit: () => people = people.SetItem(personEntryToUpsert.Id, personEntryToUpsert)));
            else
                return result.AsT1;
        }

        public IImmutableList<Family> FindFamilies(Func<Family, bool> predicate) =>
            families.Values
                .Select(p => p.ToFamily(people))
                .Where(predicate)
                .ToImmutableList();

        public IImmutableList<Person> FindPeople(Func<Person, bool> predicate) =>
            people.Values
                .Select(p => p.ToPerson())
                .Where(predicate)
                .ToImmutableList();


        private void ReplayEvent(CommunityEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is FamilyCommandExecuted familyCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteFamilyCommand(familyCommandExecuted.Command).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is PersonCommandExecuted personCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecutePersonCommand(personCommandExecuted.Command).AsT0.Value;
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
