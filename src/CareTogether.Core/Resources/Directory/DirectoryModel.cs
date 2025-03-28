using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Directory
{
    [JsonHierarchyBase]
    public abstract partial record DirectoryEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record FamilyCommandExecuted(Guid UserId, DateTime TimestampUtc,
        FamilyCommand Command) : DirectoryEvent(UserId, TimestampUtc);
    public sealed record PersonCommandExecuted(Guid UserId, DateTime TimestampUtc,
        PersonCommand Command) : DirectoryEvent(UserId, TimestampUtc);

    public sealed class DirectoryModel
    {
        internal record FamilyEntry(Guid Id, bool Active, Guid PrimaryFamilyContactPersonId,
            ImmutableDictionary<Guid, FamilyAdultRelationshipInfo> AdultRelationships,
            ImmutableList<Guid> Children,
            ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType> CustodialRelationships,
            ImmutableList<UploadedDocumentInfo> UploadedDocuments, ImmutableList<Guid> DeletedDocuments,
            ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
            ImmutableList<Activity> History)
        {
            internal Family ToFamily(ImmutableDictionary<Guid, PersonEntry> people) =>
                new(Id, Active, PrimaryFamilyContactPersonId,
                    AdultRelationships.Select(ar => (people[ar.Key].ToPerson(), ar.Value)).ToImmutableList(),
                    Children.Select(c => people[c].ToPerson()).ToImmutableList(),
                    CustodialRelationships.Select(cr => new CustodialRelationship(cr.Key.ChildId, cr.Key.AdultId, cr.Value)).ToImmutableList(),
                    UploadedDocuments, DeletedDocuments, CompletedCustomFields.Values.ToImmutableList(), History);
        }

        internal record PersonEntry(Guid Id, bool Active, string FirstName, string LastName,
            Gender? Gender, Age? Age, string? Ethnicity,
            ImmutableList<Address> Addresses, Guid? CurrentAddressId,
            ImmutableList<PhoneNumber> PhoneNumbers, Guid? PreferredPhoneNumberId,
            ImmutableList<EmailAddress> EmailAddresses, Guid? PreferredEmailAddressId,
            string? Concerns, string? Notes)
        {
            internal Person ToPerson() =>
                new(Id, Active, FirstName, LastName, Gender, Age, Ethnicity,
                    Addresses, CurrentAddressId,
                    PhoneNumbers, PreferredPhoneNumberId,
                    EmailAddresses, PreferredEmailAddressId,
                    Concerns, Notes);
        }


        private ImmutableDictionary<Guid, PersonEntry> people = ImmutableDictionary<Guid, PersonEntry>.Empty;
        private ImmutableDictionary<Guid, FamilyEntry> families = ImmutableDictionary<Guid, FamilyEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<DirectoryModel> InitializeAsync(
            IAsyncEnumerable<(DirectoryEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new DirectoryModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public (FamilyCommandExecuted Event, long SequenceNumber, Family Family, Action OnCommit)
            ExecuteFamilyCommand(FamilyCommand command, Guid userId, DateTime timestampUtc)
        {
            var familyEntryToUpsert = command switch
            {
                CreateFamily c => new FamilyEntry(c.FamilyId, Active: true, c.PrimaryFamilyContactPersonId,
                    AdultRelationships: ImmutableDictionary<Guid, FamilyAdultRelationshipInfo>.Empty.AddRange(
                        c.Adults?.Select(a => new KeyValuePair<Guid, FamilyAdultRelationshipInfo>(a.Item1, a.Item2))
                        ?? new List<KeyValuePair<Guid, FamilyAdultRelationshipInfo>>()),
                    Children: ImmutableList<Guid>.Empty.AddRange(c.Children ?? ImmutableList<Guid>.Empty),
                    CustodialRelationships: ImmutableDictionary<(Guid ChildId, Guid AdultId), CustodialRelationshipType>.Empty.AddRange(
                        c.CustodialRelationships?.Select(cr =>
                            new KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>((cr.ChildId, cr.PersonId), cr.Type))
                        ?? new List<KeyValuePair<(Guid ChildId, Guid AdultId), CustodialRelationshipType>>()),
                        ImmutableList<UploadedDocumentInfo>.Empty, DeletedDocuments: ImmutableList<Guid>.Empty,
                        CompletedCustomFields: ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                        ImmutableList<Activity>.Empty),
                _ => families.TryGetValue(command.FamilyId, out var familyEntry)
                    ? command switch
                    {
                        UndoCreateFamily c => familyEntry with { Active = false },
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
                        //TODO: Error if child is not found?
                        ConvertChildToAdult c => familyEntry with
                        {
                            Children = familyEntry.Children.Remove(c.PersonId),
                            AdultRelationships = familyEntry.AdultRelationships.Add(c.PersonId, c.NewRelationshipToFamily)
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
                            CustodialRelationships = familyEntry.CustodialRelationships.Add(
                                (c.CustodialRelationship.ChildId, c.CustodialRelationship.PersonId), c.CustodialRelationship.Type)
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
                        UploadFamilyDocument c => familyEntry with
                        {
                            UploadedDocuments = familyEntry.UploadedDocuments.Add(
                                new UploadedDocumentInfo(userId, timestampUtc, c.UploadedDocumentId, c.UploadedFileName))
                        },
                        DeleteUploadedFamilyDocument c => familyEntry with
                        {
                            UploadedDocuments = familyEntry.UploadedDocuments.RemoveAll(udi =>
                                udi.UploadedDocumentId == c.UploadedDocumentId),
                            DeletedDocuments = familyEntry.DeletedDocuments.Add(c.UploadedDocumentId)
                        },
                        ChangePrimaryFamilyContact c => familyEntry with
                        {
                            PrimaryFamilyContactPersonId = c.AdultId
                        },
                        UpdateCustomFamilyField c => familyEntry with
                        {
                            CompletedCustomFields = familyEntry.CompletedCustomFields.SetItem(
                                c.CustomFieldName,
                                new CompletedCustomFieldInfo(userId, timestampUtc, c.CompletedCustomFieldId,
                                    c.CustomFieldName, c.CustomFieldType, c.Value))
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("A family with the specified ID does not exist.")
            };

            return (
                Event: new FamilyCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Family: familyEntryToUpsert.ToFamily(people),
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    families = families.SetItem(familyEntryToUpsert.Id, familyEntryToUpsert);
                }
            );
        }

        public (PersonCommandExecuted Event, long SequenceNumber, Person Person, Action OnCommit)
            ExecutePersonCommand(PersonCommand command, Guid userId, DateTime timestampUtc)
        {
            var personEntryToUpsert = command switch
            {
                CreatePerson c => new PersonEntry(c.PersonId, Active: true, c.FirstName, c.LastName,
                    c.Gender, c.Age, c.Ethnicity,
                    c.Addresses, c.CurrentAddressId,
                    c.PhoneNumbers, c.PreferredPhoneNumberId,
                    c.EmailAddresses, c.PreferredEmailAddressId,
                    c.Concerns, c.Notes),
                _ => people.TryGetValue(command.PersonId, out var personEntry)
                    ? command switch
                    {
                        UndoCreatePerson c => personEntry with { Active = false },
                        UpdatePersonName c => personEntry with { FirstName = c.FirstName, LastName = c.LastName },
                        UpdatePersonGender c => personEntry with { Gender = c.Gender },
                        UpdatePersonAge c => personEntry with { Age = c.Age },
                        UpdatePersonEthnicity c => personEntry with { Ethnicity = c.Ethnicity },
                        UpdatePersonConcerns c => personEntry with { Concerns = c.Concerns },
                        UpdatePersonNotes c => personEntry with { Notes = c.Notes },
                        AddPersonAddress c => personEntry with
                        {
                            Addresses = personEntry.Addresses.Add(c.Address),
                            CurrentAddressId = c.IsCurrentAddress ? c.Address.Id : personEntry.CurrentAddressId
                        },
                        UpdatePersonAddress c => personEntry with
                        {
                            Addresses = personEntry.Addresses.With(c.Address, a => a.Id == c.Address.Id),
                            CurrentAddressId = c.IsCurrentAddress ? c.Address.Id : personEntry.CurrentAddressId
                        },
                        AddPersonPhoneNumber c => personEntry with
                        {
                            PhoneNumbers = personEntry.PhoneNumbers.Add(c.PhoneNumber),
                            PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? c.PhoneNumber.Id : personEntry.PreferredPhoneNumberId
                        },
                        UpdatePersonPhoneNumber c => personEntry with
                        {
                            PhoneNumbers = personEntry.PhoneNumbers.With(c.PhoneNumber, p => p.Id == c.PhoneNumber.Id),
                            PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? c.PhoneNumber.Id : personEntry.PreferredPhoneNumberId
                        },
                        AddPersonEmailAddress c => personEntry with
                        {
                            EmailAddresses = personEntry.EmailAddresses.Add(c.EmailAddress),
                            PreferredEmailAddressId = c.IsPreferredEmailAddress ? c.EmailAddress.Id : personEntry.PreferredEmailAddressId
                        },
                        UpdatePersonEmailAddress c => personEntry with
                        {
                            EmailAddresses = personEntry.EmailAddresses.With(c.EmailAddress, e => e.Id == c.EmailAddress.Id),
                            PreferredEmailAddressId = c.IsPreferredEmailAddress ? c.EmailAddress.Id : personEntry.PreferredEmailAddressId
                        },
                        _ => throw new NotImplementedException(
                            $"The command type '{command.GetType().FullName}' has not been implemented.")
                    }
                    : throw new KeyNotFoundException("A person with the specified ID does not exist.")
            };

            return (
                Event: new PersonCommandExecuted(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Person: personEntryToUpsert.ToPerson(),
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    people = people.SetItem(personEntryToUpsert.Id, personEntryToUpsert);
                }
            );
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


        private void ReplayEvent(DirectoryEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is FamilyCommandExecuted familyCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecuteFamilyCommand(familyCommandExecuted.Command,
                    familyCommandExecuted.UserId, familyCommandExecuted.TimestampUtc);
                onCommit();
            }
            else if (domainEvent is PersonCommandExecuted personCommandExecuted)
            {
                var (_, _, _, onCommit) = ExecutePersonCommand(personCommandExecuted.Command,
                    personCommandExecuted.UserId, personCommandExecuted.TimestampUtc);
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
