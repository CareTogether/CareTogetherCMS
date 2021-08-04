using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Models
{
    public sealed record ContactCommandExecutedEvent(Guid UserId, DateTime TimestampUtc,
        ContactCommand Command) : DomainEvent(UserId, TimestampUtc);

    public sealed class ContactsModel
    {
        private ImmutableDictionary<Guid, ContactInfo> contacts = ImmutableDictionary<Guid, ContactInfo>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<ContactsModel> InitializeAsync(
            IAsyncEnumerable<(ContactCommandExecutedEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new ContactsModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public OneOf<Success<(ContactCommandExecutedEvent Event, long SequenceNumber, ContactInfo Contact, Action OnCommit)>, Error<string>>
            ExecuteContactCommand(ContactCommand command, Guid userId, DateTime timestampUtc)
        {
            ContactInfo contact;
            if (command is CreateContact create)
                contact = new ContactInfo(create.PersonId, new List<Address>(), null, new List<PhoneNumber>(), null, new List<EmailAddress>(), null,
                    create.ContactMethodPreferenceNotes);
            else
            {
                if (!contacts.TryGetValue(command.PersonId, out contact))
                    return new Error<string>("A person with the specified ID does not exist.");

                contact = command switch
                {
                    AddContactAddress c => contact with
                    {
                        Addresses = contact.Addresses.With(c.Address),
                        CurrentAddressId = c.IsCurrentAddress ? c.Address.Id : contact.CurrentAddressId
                    },
                    UpdateContactAddress c => contact with
                    {
                        Addresses = contact.Addresses.With(c.Address, a => a.Id == c.Address.Id),
                        CurrentAddressId = c.IsCurrentAddress ? c.Address.Id : contact.CurrentAddressId
                    },
                    AddContactPhoneNumber c => contact with
                    {
                        PhoneNumbers = contact.PhoneNumbers.With(c.PhoneNumber),
                        PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? c.PhoneNumber.Id : contact.PreferredPhoneNumberId
                    },
                    UpdateContactPhoneNumber c => contact with
                    {
                        PhoneNumbers = contact.PhoneNumbers.With(c.PhoneNumber, p => p.Id == c.PhoneNumber.Id),
                        PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? c.PhoneNumber.Id : contact.PreferredPhoneNumberId
                    },
                    AddContactEmailAddress c => contact with
                    {
                        EmailAddresses = contact.EmailAddresses.With(c.EmailAddress),
                        PreferredEmailAddressId = c.IsPreferredEmailAddress ? c.EmailAddress.Id : contact.PreferredEmailAddressId
                    },
                    UpdateContactEmailAddress c => contact with
                    {
                        EmailAddresses = contact.EmailAddresses.With(c.EmailAddress, e => e.Id == c.EmailAddress.Id),
                        PreferredEmailAddressId = c.IsPreferredEmailAddress ? c.EmailAddress.Id : contact.PreferredEmailAddressId
                    },
                    UpdateContactMethodPreferenceNotes c => contact with
                    {
                        ContactMethodPreferenceNotes = c.ContactMethodPreferenceNotes
                    },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                };
            }

            return new Success<(ContactCommandExecutedEvent Event, long SequenceNumber, ContactInfo Contact, Action OnCommit)>((
                Event: new ContactCommandExecutedEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Contact: contact,
                OnCommit: () => { contacts = contacts.SetItem(contact.PersonId, contact); }
            ));
        }

        public ImmutableList<ContactInfo> FindContacts(Func<ContactInfo, bool> predicate) =>
            contacts.Values
                .Where(predicate)
                .ToImmutableList();


        private void ReplayEvent(ContactCommandExecutedEvent domainEvent, long sequenceNumber)
        {
            var (_, _, _, onCommit) = ExecuteContactCommand(domainEvent.Command,
                    domainEvent.UserId, domainEvent.TimestampUtc).AsT0.Value;
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
