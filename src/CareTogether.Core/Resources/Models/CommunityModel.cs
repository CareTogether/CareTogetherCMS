using JsonPolymorph;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Models
{
    [JsonHierarchyBase]
    public abstract partial record CommunityEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record FamilyCommandExecuted(Guid UserId, DateTime TimestampUtc,
        FamilyCommand Command) : CommunityEvent(UserId, TimestampUtc);
    public sealed record PersonCommandExecuted(Guid UserId, DateTime TimestampUtc,
        PersonCommand Command) : CommunityEvent(UserId, TimestampUtc);

    public sealed class CommunityModel
    {
        internal record FamilyEntry(Guid Id,
            ImmutableDictionary<Guid, FamilyAdultRelationshipInfo> AdultRelationships,
            ImmutableList<Guid> Children,
            ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType> CustodialRelationships)
        {
            internal Family ToFamily(ImmutableDictionary<Guid, PersonEntry> people) =>
                new(Id,
                    AdultRelationships.Select(ar => (people[ar.Key].ToPerson(), ar.Value)).ToList(),
                    Children.Select(c => people[c].ToPerson()).ToList(),
                    CustodialRelationships.Select(cr => new CustodialRelationship(cr.Key.ChildId, cr.Key.AdultId, cr.Value)).ToList());
        }

        internal record PersonEntry(Guid Id, Guid? UserId, string FirstName, string LastName, Gender Gender, Age Age, string Ethnicity)
        {
            internal Person ToPerson() =>
                new(Id, UserId, FirstName, LastName, Gender, Age, Ethnicity);
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
            ExecuteFamilyCommand(FamilyCommand command, Guid userId, DateTime timestampUtc)
        {
            OneOf<FamilyEntry, Error<string>> result = command switch
            {
                CreateFamily c => new FamilyEntry(c.FamilyId,
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
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("A family with the specified ID does not exist.")
            };
            if (result.TryPickT0(out var familyEntryToUpsert, out var error))
                return new Success<(FamilyCommandExecuted Event, long SequenceNumber, Family Family, Action OnCommit)>((
                    Event: new FamilyCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    Family: familyEntryToUpsert.ToFamily(people),
                    OnCommit: () => families = families.SetItem(familyEntryToUpsert.Id, familyEntryToUpsert)));
            else
                return result.AsT1;
        }

        public OneOf<Success<(PersonCommandExecuted Event, long SequenceNumber, Person Person, Action OnCommit)>, Error<string>>
            ExecutePersonCommand(PersonCommand command, Guid userId, DateTime timestampUtc)
        {
            OneOf<PersonEntry, Error<string>> result = command switch
            {
                CreatePerson c => new PersonEntry(c.PersonId, c.UserId, c.FirstName, c.LastName, c.Gender, c.Age, c.Ethnicity),
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
                    Event: new PersonCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    Person: personEntryToUpsert.ToPerson(),
                    OnCommit: () => people = people.SetItem(personEntryToUpsert.Id, personEntryToUpsert)));
            else
                return result.AsT1;
        }

        public ImmutableList<Family> FindFamilies(Func<Family, bool> predicate) =>
            families.Values
                .Select(p => p.ToFamily(people))
                .Where(predicate)
                .ToImmutableList();

        public ImmutableList<Person> FindPeople(Func<Person, bool> predicate) =>
            people.Values
                .Select(p => p.ToPerson())
                .Where(predicate)
                .ToImmutableList();


        private void ReplayEvent(CommunityEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is FamilyCommandExecuted familyCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteFamilyCommand(familyCommandExecuted.Command,
                    familyCommandExecuted.UserId, familyCommandExecuted.TimestampUtc).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is PersonCommandExecuted personCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecutePersonCommand(personCommandExecuted.Command,
                    personCommandExecuted.UserId, personCommandExecuted.TimestampUtc).AsT0.Value;
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
