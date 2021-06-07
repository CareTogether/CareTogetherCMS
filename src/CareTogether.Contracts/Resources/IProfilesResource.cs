using JsonPolymorph;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record ContactInfo(Guid PersonId,
        List<Address> Addresses, Guid? CurrentAddressId,
        List<PhoneNumber> PhoneNumbers, Guid? PreferredPhoneNumberId,
        List<EmailAddress> EmailAddresses, Guid? PreferredEmailAddressId,
        string ContactMethodPreferenceNotes);
    public sealed record Address(Guid Id,
        string Line1, string Line2, string City, Guid StateId, string PostalCode, Guid CountryId);
    public sealed record State(Guid Id, string Name);
    public sealed record Country(Guid Id, string Name);
    public sealed record PhoneNumber(Guid Id, string Number, PhoneNumberType Type);
    public enum PhoneNumberType { Mobile, Home, Work, Fax }
    public sealed record EmailAddress(Guid Id, string Address, EmailAddressType Type);
    public enum EmailAddressType { Personal, Work }

    //TODO: Split this into 'RequestFields' (a 'Request' concept, linked to a ReferralId)
    //      and non-referral-specific Goals!
    // Update... 'request' is just a form (can be an unstructured PDF or semistructured JSON)
    //      that is required as part of a *workflow*. The actual contents are only kept for reference,
    //      and potentially future search/analytics capabilities.
    //   ***This means that the Profile only needs to include the Goals!!
    public sealed record PartneringFamilyProfile(Guid FamilyId,
        JObject FamilyIntakeFields,
        Dictionary<Guid, JObject> AdultIntakeFields,
        Dictionary<Guid, JObject> ChildIntakeFields,
        List<Goal> Goals);
    public sealed record Goal(Guid Id, Guid PersonId,
        string Description, DateTime CreatedDate, DateTime TargetDate, DateTime CompletedDate);

    public sealed record VolunteerFamilyProfile(Guid FamilyId);


    [JsonHierarchyBase]
    public abstract partial record ContactCommand(Guid ContactId);
    public sealed record CreateContact(Guid PersonId,
        string ContactMethodPreferenceNotes) : ContactCommand(PersonId);
    public sealed record AddContactAddress(Guid ContactId,
        string Line1, string Line2, string City, Guid StateId, string PostalCode, Guid CountryId,
        bool IsCurrentAddress) : ContactCommand(ContactId);
    public sealed record UpdateContactAddress(Guid ContactId, Address Address,
        bool IsCurrentAddress) : ContactCommand(ContactId);
    public sealed record AddContactPhoneNumber(Guid ContactId,
        string Number, PhoneNumberType Type,
        bool IsPreferredPhoneNumber) : ContactCommand(ContactId);
    public sealed record UpdateContactPhoneNumber(Guid ContactId, PhoneNumber PhoneNumber,
        bool IsPreferredPhoneNumber) : ContactCommand(ContactId);
    public sealed record AddContactEmailAddress(Guid ContactId,
        string Address, EmailAddressType Type,
        bool IsPreferredEmailAddress) : ContactCommand(ContactId);
    public sealed record UpdateContactEmailAddress(Guid ContactId, EmailAddress EmailAddress,
        bool IsPreferredEmailAddress) : ContactCommand(ContactId);
    public sealed record UpdateContactMethodPreferenceNotes(Guid ContactId,
        string ContactMethodPreferenceNotes) : ContactCommand(ContactId);

    [JsonHierarchyBase]
    public abstract partial record PartneringFamilyProfileCommand(Guid FamilyId);

    /// <summary>
    /// The <see cref="IProfilesResource"/> is responsible for all personal information in CareTogether.
    /// This includes generally-privileged information like names and contact information, as well as
    /// more restricted information like intake forms, goals, and volunteer application forms.
    /// </summary>
    public interface IProfilesResource
    {
        Task<ContactInfo> ExecuteContactCommandAsync(Guid organizationId, Guid locationId, ContactCommand command);

        //TODO: Include a 'not found' result option via OneOf<...> here!
        Task<ContactInfo> FindUserProfileAsync(Guid organizationId, Guid locationId, Guid personId);

        //public Task<PartneringFamilyProfile> ExecutePartneringFamilyProfileCommandAsync(
        //    Guid organizationId, Guid locationId, PartneringFamilyProfileCommand command);

        IQueryable<ContactInfo> QueryContacts(Guid organizationId, Guid locationId);

        //public IQueryable<PartneringFamilyProfile> QueryPartneringFamilyProfiles(Guid organizationId, Guid locationId);
    }
}
