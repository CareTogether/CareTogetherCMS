using CareTogether.Utilities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ProfilesResource : IProfilesResource
    {
        private readonly IMultitenantKeyValueStore<ContactInfo> contactStore;


        public ProfilesResource(IMultitenantKeyValueStore<ContactInfo> contactStore)
        {
            this.contactStore = contactStore;
        }


        public async Task<ContactInfo> ExecuteContactCommandAsync(
            Guid organizationId, Guid locationId, ContactCommand command)
        {
            // When constructing or mutating a record with multiple properties that all need to reference the same ID,
            // the ID needs to be created ahead of time. For convenience, we'll create a single new ID here and use it
            // in situations where a new ID is needed. Currently all command implementations require at most one new ID.
            var newId = Guid.NewGuid();

            ContactInfo contact;
            if (command is CreateContact create)
                contact = new ContactInfo(newId, null, null, null, null, null, null, null);
            else
            {
                contact = await contactStore.GetValueAsync(organizationId, locationId, command.ContactId);
                contact = command switch
                {
                    AddContactAddress c => contact with
                    {
                        Addresses = contact.Addresses.With(
                            new Address(newId, c.Line1, c.Line2, c.City, c.StateId, c.PostalCode, c.CountryId)),
                        CurrentAddressId = c.IsCurrentAddress ? newId : contact.CurrentAddressId
                    },
                    UpdateContactAddress c => contact with
                    {
                        Addresses = contact.Addresses.With(c.Address, a => a.Id == c.Address.Id),
                        CurrentAddressId = c.IsCurrentAddress ? c.Address.Id : contact.CurrentAddressId
                    },
                    AddContactPhoneNumber c => contact with
                    {
                        PhoneNumbers = contact.PhoneNumbers.With(new PhoneNumber(newId, c.Number, c.Type)),
                        PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? newId : contact.PreferredPhoneNumberId
                    },
                    UpdateContactPhoneNumber c => contact with
                    {
                        PhoneNumbers = contact.PhoneNumbers.With(c.PhoneNumber, p => p.Id == c.PhoneNumber.Id),
                        PreferredPhoneNumberId = c.IsPreferredPhoneNumber ? c.PhoneNumber.Id : contact.PreferredPhoneNumberId
                    },
                    AddContactEmailAddress c => contact with
                    {
                        EmailAddresses = contact.EmailAddresses.With(new EmailAddress(newId, c.Address, c.Type)),
                        PreferredEmailAddressId = c.IsPreferredEmailAddress ? newId : contact.PreferredEmailAddressId
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

            await contactStore.UpsertValueAsync(organizationId, locationId, contact.PersonId, contact);

            return contact;
        }

        public IQueryable<ContactInfo> QueryContacts(Guid organizationId, Guid locationId)
        {
            var source = contactStore.QueryValues(organizationId, locationId);
            return source;
        }
    }
}
