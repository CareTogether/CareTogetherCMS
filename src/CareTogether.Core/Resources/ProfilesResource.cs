using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class ProfilesResource : IProfilesResource
    {
        private readonly IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog;
        private readonly IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), ContactsModel> tenantContactsModels;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel> tenantGoalsModels;


        public ProfilesResource(
            IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog,
            IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            this.contactsEventLog = contactsEventLog;
            this.goalsEventLog = goalsEventLog;
            tenantContactsModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), ContactsModel>(key =>
                ContactsModel.InitializeAsync(contactsEventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
            tenantGoalsModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel>(key =>
                GoalsModel.InitializeAsync(goalsEventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }



        public async Task<ResourceResult<ContactInfo>> ExecuteContactCommandAsync(
            Guid organizationId, Guid locationId, ContactCommand command, Guid userId)
        {
            using (var lockedModel = await tenantContactsModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteContactCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await contactsEventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.Contact;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId)
        {
            using (var lockedModel = await tenantContactsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindContacts(c => true)
                    .ToImmutableDictionary(c => c.PersonId);
            }
        }

        public async Task<ResourceResult<ContactInfo>> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantContactsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.FindContacts(c => c.PersonId == personId).SingleOrDefault();
                if (result != null)
                    return result;
                else
                    return ResourceResult.NotFound;
            }
        }

        public async Task<ResourceResult<Goal>> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command,
            Guid userId)
        {
            using (var lockedModel = await tenantGoalsModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteGoalCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await goalsEventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.Goal;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
            }
        }

        public async Task<ImmutableList<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantGoalsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindGoals(c => c.PersonId == personId);
            }
        }
    }
}
