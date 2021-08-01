using CareTogether.Abstractions;
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
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<ContactsModel>> tenantContactsModels = new();
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<GoalsModel>> tenantGoalsModels = new();


        public ProfilesResource(
            IMultitenantEventLog<ContactCommandExecutedEvent> contactsEventLog,
            IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            this.contactsEventLog = contactsEventLog;
            this.goalsEventLog = goalsEventLog;
        }



        public async Task<ResourceResult<ContactInfo>> ExecuteContactCommandAsync(
            Guid organizationId, Guid locationId, ContactCommand command, Guid userId)
        {
            var model = await GetTenantContactsModelAsync(organizationId, locationId);
            var result = model.ExecuteContactCommand(command, userId, DateTime.UtcNow);
            if (result.TryPickT0(out var success, out var _))
            {
                await contactsEventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                success.Value.OnCommit();
                return success.Value.Contact;
            }
            else
                return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
        }

        public async Task<IImmutableDictionary<Guid, ContactInfo>> ListContactsAsync(Guid organizationId, Guid locationId)
        {
            var model = await GetTenantContactsModelAsync(organizationId, locationId);
            return model.FindContacts(c => true)
                .ToImmutableDictionary(c => c.PersonId);
        }

        public async Task<ResourceResult<ContactInfo>> FindUserContactInfoAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            var model = await GetTenantContactsModelAsync(organizationId, locationId);
            var result = model.FindContacts(c => c.PersonId == personId).SingleOrDefault();
            if (result != null)
                return result;
            else
                return ResourceResult.NotFound;
        }

        public async Task<ResourceResult<Goal>> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command,
            Guid userId)
        {
            var model = await GetTenantGoalsModelAsync(organizationId, locationId);
            var result = model.ExecuteGoalCommand(command, userId, DateTime.UtcNow);
            if (result.TryPickT0(out var success, out var _))
            {
                await goalsEventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                success.Value.OnCommit();
                return success.Value.Goal;
            }
            else
                return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
        }

        public async Task<IImmutableList<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            var model = await GetTenantGoalsModelAsync(organizationId, locationId);
            return model.FindGoals(c => c.PersonId == personId);
        }


        private async Task<ContactsModel> GetTenantContactsModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantContactsModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ContactsModel>(() =>
                ContactsModel.InitializeAsync(contactsEventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }

        private async Task<GoalsModel> GetTenantGoalsModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantGoalsModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<GoalsModel>(() =>
                GoalsModel.InitializeAsync(goalsEventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }
    }
}
