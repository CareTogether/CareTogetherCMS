using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record ContactInfo(Guid PersonId,
        List<Address> Addresses, Guid? CurrentAddressId,
        List<PhoneNumber> PhoneNumbers, Guid? PreferredPhoneNumberId,
        List<EmailAddress> EmailAddresses, Guid? PreferredEmailAddressId,
        string ContactMethodPreferenceNotes);
    public sealed record Address(Guid Id,
        string Line1, string? Line2, string City, Guid StateId, string PostalCode, Guid CountryId);
    public sealed record State(Guid Id, string Name);
    public sealed record Country(Guid Id, string Name);
    public sealed record PhoneNumber(Guid Id, string Number, PhoneNumberType Type);
    public enum PhoneNumberType { Mobile, Home, Work, Fax }
    public sealed record EmailAddress(Guid Id, string Address, EmailAddressType Type);
    public enum EmailAddressType { Personal, Work }

    [JsonHierarchyBase]
    public abstract partial record ContactCommand(Guid PersonId);
    public sealed record CreateContact(Guid PersonId,
        string ContactMethodPreferenceNotes) : ContactCommand(PersonId);
    public sealed record AddContactAddress(Guid PersonId, Address Address, bool IsCurrentAddress)
        : ContactCommand(PersonId);
    public sealed record UpdateContactAddress(Guid PersonId, Address Address, bool IsCurrentAddress)
        : ContactCommand(PersonId); //TODO: Distinguish address correction from current address change
    public sealed record AddContactPhoneNumber(Guid PersonId, PhoneNumber PhoneNumber,
        bool IsPreferredPhoneNumber) : ContactCommand(PersonId);
    public sealed record UpdateContactPhoneNumber(Guid PersonId, PhoneNumber PhoneNumber,
        bool IsPreferredPhoneNumber) : ContactCommand(PersonId);
    public sealed record AddContactEmailAddress(Guid PersonId, EmailAddress EmailAddress,
        bool IsPreferredEmailAddress) : ContactCommand(PersonId);
    public sealed record UpdateContactEmailAddress(Guid PersonId, EmailAddress EmailAddress,
        bool IsPreferredEmailAddress) : ContactCommand(PersonId);
    public sealed record UpdateContactMethodPreferenceNotes(Guid PersonId,
        string ContactMethodPreferenceNotes) : ContactCommand(PersonId);

    /// <summary>
    /// The <see cref="IContactsResource"/> is responsible for all contact information in CareTogether.
    /// </summary>
    public interface IContactsResource
    {
        Task<ContactInfo> ExecuteContactCommandAsync(Guid organizationId, Guid locationId, ContactCommand command, Guid userId);

        Task<ContactInfo> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId);

        Task<ImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId);
    }
}
