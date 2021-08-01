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
        string Line1, string Line2, string City, Guid StateId, string PostalCode, Guid CountryId);
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

    public sealed record Goal(Guid Id, Guid PersonId,
        string Description, DateTime CreatedDate, DateTime? TargetDate, DateTime? CompletedDate);

    [JsonHierarchyBase]
    public abstract partial record GoalCommand(Guid PersonId, Guid GoalId);
    public sealed record CreateGoal(Guid PersonId, Guid GoalId, string Description, DateTime CreatedDate,
        DateTime? TargetDate) : GoalCommand(PersonId, GoalId);
    public sealed record ChangeGoalDescription(Guid PersonId, Guid GoalId, string Description)
        : GoalCommand(PersonId, GoalId);
    public sealed record ChangeGoalTargetDate(Guid PersonId, Guid GoalId, DateTime? TargetDate)
        : GoalCommand(PersonId, GoalId);
    public sealed record MarkGoalCompleted(Guid PersonId, Guid GoalId, DateTime CompletedDate)
        : GoalCommand(PersonId, GoalId);

    /// <summary>
    /// The <see cref="IProfilesResource"/> is responsible for all personal information in CareTogether.
    /// This includes generally-privileged information like names and contact information, as well as
    /// more restricted information like intake forms, goals, and volunteer application forms.
    /// </summary>
    public interface IProfilesResource
    {
        Task<ResourceResult<ContactInfo>> ExecuteContactCommandAsync(Guid organizationId, Guid locationId, ContactCommand command, Guid userId);

        Task<ResourceResult<ContactInfo>> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId);

        Task<IImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId);

        Task<ResourceResult<Goal>> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command, Guid userId);

        Task<IImmutableList<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId);
    }
}
