using CareTogether.Abstractions;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        private readonly IMultitenantEventLog<CommunityEvent> eventLog;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<CommunityModel>> tenantModels = new();


        public CommunitiesResource(IMultitenantEventLog<CommunityEvent> eventLog)
        {
            this.eventLog = eventLog;
        }


        public async Task<ResourceResult<Family>> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId, FamilyCommand command)
        {
            var model = await GetTenantModelAsync(organizationId, locationId);
            var result = model.ExecuteFamilyCommand(command);
            if (result.TryPickT0(out var success, out var _))
            {
                await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                success.Value.OnCommit();
                return success.Value.Family;
            }
            else
                return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
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


        private async Task<CommunityModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<CommunityModel>(() =>
                CommunityModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }
    }
}
