using CareTogether.Abstractions;
using ExRam.Gremlinq.Core;
using JsonPolymorph;
using Nito.AsyncEx;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        private readonly IMultitenantEventLog<CommunitiesEvent> eventLog;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<CommunitiesModel>> tenantModels =
            new ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<CommunitiesModel>>();


        public CommunitiesResource(IMultitenantEventLog<CommunitiesEvent> eventLog)
        {
            this.eventLog = eventLog;
        }


        public Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command)
        {
            throw new NotImplementedException();
        }

        public async Task<ResourceResult<Person>> ExecutePersonCommandAsync(Guid organizationId, Guid locationId, PersonCommand command)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            var result = model.ExecutePersonCommand(command);
            if (result.TryPickT0(out var success, out var _))
            {
                await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                success.Value.OnCommit();
                return success.Value.Person;
            }
            else
                return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
        }

        public async Task<IImmutableList<Person>> FindPeopleAsync(Guid organizationId, Guid locationId, string partialFirstOrLastName)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            return model.FindPeople(p =>
                p.FirstName.Contains(partialFirstOrLastName) || p.LastName.Contains(partialFirstOrLastName));
        }

        public async Task<ResourceResult<Person>> FindUserAsync(Guid organizationId, Guid locationId, Guid userId)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            var result = model.FindPeople(p => p.UserId == userId);
            if (result.Count == 1)
                return result.Single();
            else
                //TODO: Handle the exception case where multiple people have the same user ID assigned, or
                //      protect against that scenario in the domain model.
                return ResourceResult.NotFound;
        }

        public async Task<IImmutableList<Family>> ListPartneringFamilies(Guid organizationId, Guid locationId)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            return model.FindFamilies(f =>
                f.PartneringFamilyStatus == PartneringFamilyStatus.Active ||
                f.PartneringFamilyStatus == PartneringFamilyStatus.Inactive);
        }

        public async Task<IImmutableList<Family>> ListVolunteerFamilies(Guid organizationId, Guid locationId)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            return model.FindFamilies(f =>
                f.VolunteerFamilyStatus == VolunteerFamilyStatus.Active ||
                f.VolunteerFamilyStatus == VolunteerFamilyStatus.Inactive);
        }


        private async Task<CommunitiesModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<CommunitiesModel>(() =>
                CommunitiesModel.InitializeAsync(organizationId, locationId, eventLog)));
            return await lazyModel.Task;
        }
    }

    [JsonHierarchyBase]
    public abstract partial record CommunitiesEvent();
    public sealed record FamilyCommandExecuted(FamilyCommand Command) : CommunitiesEvent;
    public sealed record PersonCommandExecuted(PersonCommand Command) : CommunitiesEvent;


    public sealed class CommunitiesModel
    {
        //TODO: Implement thread safety using a reader writer lock (slim)?

        internal record FamilyEntry(Guid Id,
            PartneringFamilyStatus? PartneringFamilyStatus, VolunteerFamilyStatus? VolunteerFamilyStatus,
            ImmutableDictionary<Guid, FamilyAdultRelationshipInfo> AdultRelationships,
            ImmutableList<Guid> Children,
            ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType> CustodialRelationships)
        {
            internal Family ToFamily(IImmutableDictionary<Guid, PersonEntry> people) =>
                new Family(Id, VolunteerFamilyStatus, PartneringFamilyStatus,
                    AdultRelationships.Select(ar => (people[ar.Key].ToPerson(), ar.Value)).ToList(),
                    Children.Select(c => people[c].ToPerson()).ToList(),
                    CustodialRelationships.Select(cr => new CustodialRelationship(cr.Key.ChildId, cr.Key.AdultId, cr.Value)).ToList());
        }

        internal record PersonEntry(Guid Id, Guid? UserId, string FirstName, string LastName, Age Age)
        {
            internal Person ToPerson() =>
                new Person(Id, UserId, FirstName, LastName, Age);
        }


        private readonly Guid organizationId;
        private readonly Guid locationId;
        private ImmutableDictionary<Guid, PersonEntry> people = ImmutableDictionary<Guid, PersonEntry>.Empty;
        private ImmutableDictionary<Guid, FamilyEntry> families = ImmutableDictionary<Guid, FamilyEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        private CommunitiesModel(Guid organizationId, Guid locationId)
        {
            this.organizationId = organizationId;
            this.locationId = locationId;
        }


        public static async Task<CommunitiesModel> InitializeAsync(Guid organizationId, Guid locationId,
            IMultitenantEventLog<CommunitiesEvent> eventLog)
        {
            var model = new CommunitiesModel(organizationId, locationId);

            await foreach (var (domainEvent, sequenceNumber) in eventLog.GetAllEventsAsync(organizationId, locationId))
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            return model;
        }


        public OneOf<Success<(FamilyCommandExecuted Event, long SequenceNumber, Family Family, Action OnCommit)>, Error<string>>
            ExecuteFamilyCommand(FamilyCommand command)
        {
            OneOf<FamilyEntry, Error<string>> result = command switch
            {
                CreateFamily c => new FamilyEntry(Guid.NewGuid(), c.PartneringFamilyStatus, c.VolunteerFamilyStatus,
                    AdultRelationships: ImmutableDictionary<Guid, FamilyAdultRelationshipInfo>.Empty.AddRange(
                        c.Adults.Select(a => new KeyValuePair<Guid, FamilyAdultRelationshipInfo>(a.Item1, a.Item2))),
                    Children: ImmutableList<Guid>.Empty.AddRange(c.Children),
                    CustodialRelationships: ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType>.Empty.AddRange(
                        c.CustodialRelationships.Select(cr =>
                            new KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>((cr.ChildId, cr.PersonId), cr.Type)))),
                _ => families.TryGetValue(command.FamilyId, out var familyEntry)
                    ? command switch
                    {
                        //TODO: Error if key already exists
                        //TODO: Error if person is not found
                        AddAdultToFamily c => familyEntry with {
                            AdultRelationships = familyEntry.AdultRelationships.Add(c.AdultPersonId, c.RelationshipToFamily) },
                        //TODO: Error if key already exists
                        //TODO: Error if person is not found
                        AddChildToFamily c => familyEntry with {
                            Children = familyEntry.Children.Add(c.ChildPersonId),
                            CustodialRelationships = familyEntry.CustodialRelationships.AddRange(c.CustodialRelationships.Select(cr =>
                                new KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>((cr.ChildId, cr.PersonId), cr.Type))) },
                        //TODO: Error if key is not found
                        UpdateAdultRelationshipToFamily c => familyEntry with {
                            AdultRelationships = familyEntry.AdultRelationships.SetItem(c.AdultPersonId, c.RelationshipToFamily) },
                        //TODO: Error if adult is not found
                        //TODO: Error if child is not found
                        AddCustodialRelationship c => familyEntry with {
                            CustodialRelationships = familyEntry.CustodialRelationships.Add((c.ChildPersonId, c.AdultPersonId), c.Type) },
                        //TODO: Error if key is not found
                        UpdateCustodialRelationshipType c => familyEntry with {
                            CustodialRelationships = familyEntry.CustodialRelationships.SetItem((c.ChildPersonId, c.AdultPersonId), c.Type) },
                        //TODO: Error if key is not found
                        RemoveCustodialRelationship c => familyEntry with {
                            CustodialRelationships = familyEntry.CustodialRelationships.Remove((c.ChildPersonId, c.AdultPersonId)) },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : new Error<string>("A person with the specified ID does not exist.")
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
                CreatePerson c => new PersonEntry(Guid.NewGuid(), c.UserId, c.FirstName, c.LastName, c.Age),
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


        private void ReplayEvent(CommunitiesEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is FamilyCommandExecuted familyCommandExecuted)
            {
                ExecuteFamilyCommand(familyCommandExecuted.Command);
            }
            else if (domainEvent is PersonCommandExecuted personCommandExecuted)
            {
                ExecutePersonCommand(personCommandExecuted.Command);
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
