using CareTogether.Abstractions;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ProfilesResource : IProfilesResource
    {
        private readonly IMultitenantKeyValueStore<ContactInfo> contactStore;
        private readonly IMultitenantKeyValueStore<Dictionary<Guid, Goal>> goalsStore;


        public ProfilesResource(IMultitenantKeyValueStore<ContactInfo> contactStore,
            IMultitenantKeyValueStore<Dictionary<Guid, Goal>> goalsStore)
        {
            this.contactStore = contactStore;
            this.goalsStore = goalsStore;
        }


        public async Task<ResourceResult<ContactInfo>> ExecuteContactCommandAsync(
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
                var contactResult = await contactStore.GetValueAsync(organizationId, locationId, command.PersonId);
                if (contactResult.TryPickT1(out NotFound _, out contact))
                    return ResourceResult.NotFound;
                
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

        public Task<IImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId)
        {
            return Task.Run(() =>
                (IImmutableDictionary<Guid, ContactInfo>)
                contactStore.QueryValues(organizationId, locationId).ToImmutableDictionary(c => c.PersonId));
        }

        public async Task<ResourceResult<ContactInfo>> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            var source = await contactStore.GetValueAsync(organizationId, locationId, personId);
            return source.Match<ResourceResult<ContactInfo>>(
                contact => contact,
                notFound => notFound);
        }

        public async Task<ResourceResult<Goal>> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command)
        {
            // When constructing or mutating a record with multiple properties that all need to reference the same ID,
            // the ID needs to be created ahead of time. For convenience, we'll create a single new ID here and use it
            // in situations where a new ID is needed. Currently all command implementations require at most one new ID.
            var newId = Guid.NewGuid();

            var goalsResult = await goalsStore.GetValueAsync(organizationId, locationId, command.PersonId);
            if (goalsResult.TryPickT1(out NotFound _, out var goals))
                goals = new Dictionary<Guid, Goal>();

            Goal goal;
            if (command is CreateGoal create)
                goal = new Goal(newId, create.PersonId, create.Description,
                    CreatedDate: DateTime.UtcNow, TargetDate: create.TargetDate, CompletedDate: null);
            else
            {
                var goalId = command switch
                {
                    ChangeGoalDescription c => c.GoalId,
                    ChangeGoalTargetDate c => c.GoalId,
                    MarkGoalCompleted c => c.GoalId,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                };
                if (!goals.TryGetValue(goalId, out goal))
                    return ResourceResult.NotFound;
                goal = command switch
                {
                    ChangeGoalDescription c => goal with
                    {
                        Description = c.Description
                    },
                    ChangeGoalTargetDate c => goal with
                    {
                        TargetDate = c.TargetDate
                    },
                    MarkGoalCompleted c => goal with
                    {
                        CompletedDate = DateTime.UtcNow
                    },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented." +
                        " This exception should never be reached because of a prior check for the goal type.")
                };
            }
            goals[goal.Id] = goal;

            await goalsStore.UpsertValueAsync(organizationId, locationId, command.PersonId, goals);

            return goal;
        }

        public async Task<List<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            var personGoals = await goalsStore.GetValueAsync(organizationId, locationId, personId);
            return personGoals.Match(
                goals => goals.Values.ToList(),
                notFound => new List<Goal>());
        }
    }
}
