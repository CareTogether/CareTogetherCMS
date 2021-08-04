using CareTogether.Engines;
using CareTogether.Resources;
using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ApprovalManager : IApprovalManager
    {
        private readonly IMultitenantEventLog<ApprovalEvent> eventLog;
        private readonly ConcurrentDictionary<(Guid organizationId, Guid locationId), AsyncLazy<ApprovalModel>> tenantModels = new();
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly ICommunitiesResource communitiesResource;
        private readonly IContactsResource contactsResource;


        public ApprovalManager(IMultitenantEventLog<ApprovalEvent> eventLog, IPolicyEvaluationEngine policyEvaluationEngine,
            ICommunitiesResource communitiesResource, IContactsResource contactsResource)
        {
            this.eventLog = eventLog;
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.communitiesResource = communitiesResource;
            this.contactsResource = contactsResource;
        }


        public async Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(AuthorizedUser user, Guid organizationId, Guid locationId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                var volunteerFamilies = tenantModel.FindVolunteerFamilyEntries(_ => true);
                var result = await volunteerFamilies.Select(vf => ToVolunteerFamilyAsync(
                    organizationId, locationId, vf, families, contacts)).WhenAll();
                return result.ToImmutableList();
            }
        }

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var getVolunteerFamilyResult = tenantModel.GetVolunteerFamilyEntry(command.FamilyId);
                if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
                {
                    var families = communitiesResource.ListVolunteerFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                    var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                    var referral = await ToVolunteerFamilyAsync(
                        organizationId, locationId, volunteerFamilyEntry, families, contacts);

                    var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerFamilyCommandAsync(
                        organizationId, locationId, user, command, referral);
                    if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                    {
                        var commandResult = tenantModel.ExecuteVolunteerFamilyCommand(command, user.UserId, DateTime.UtcNow);
                        if (commandResult.TryPickT0(out var success, out var commandError))
                        {
                            await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                            success.Value.OnCommit();
                            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                                await ToVolunteerFamilyAsync(
                                    organizationId, locationId, success.Value.VolunteerFamilyEntry, families, contacts));
                            return disclosedVolunteerFamily;
                        }
                        else
                            return ManagerResult.NotAllowed; //TODO: Include reason from 'commandError'?
                    }
                    else
                        return ManagerResult.NotAllowed; //TODO: Include reason from 'authorizationError'?
                }
                else
                    return notFound;
            }
        }

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var getVolunteerFamilyResult = tenantModel.GetVolunteerFamilyEntry(command.FamilyId);
                if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
                {
                    var families = communitiesResource.ListVolunteerFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                    var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                    var referral = await ToVolunteerFamilyAsync(
                        organizationId, locationId, volunteerFamilyEntry, families, contacts);

                    var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerCommandAsync(
                        organizationId, locationId, user, command, referral);
                    if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                    {
                        var commandResult = tenantModel.ExecuteVolunteerCommand(command, user.UserId, DateTime.UtcNow);
                        if (commandResult.TryPickT0(out var success, out var commandError))
                        {
                            await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                            success.Value.OnCommit();
                            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                                await ToVolunteerFamilyAsync(
                                    organizationId, locationId, success.Value.VolunteerFamilyEntry, families, contacts));
                            return disclosedVolunteerFamily;
                        }
                        else
                            return ManagerResult.NotAllowed; //TODO: Include reason from 'commandError'?
                    }
                    else
                        return ManagerResult.NotAllowed; //TODO: Include reason from 'authorizationError'?
                }
                else
                    return notFound;
            }
        }


        private async Task<ApprovalModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ApprovalModel>(() =>
                ApprovalModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }

        private async Task<VolunteerFamily> ToVolunteerFamilyAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyEntry entry,
            ImmutableDictionary<Guid, Family> families,
            ImmutableDictionary<Guid, ContactInfo> contacts)
        {
            var family = families[entry.FamilyId];
            var individualInfo = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => (x.Value.ApprovalFormUploads, x.Value.ApprovalActivitiesPerformed));
            
            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family,
                entry.ApprovalFormUploads, entry.ApprovalActivitiesPerformed,
                individualInfo);

            return new VolunteerFamily(family,
                entry.ApprovalFormUploads, entry.ApprovalActivitiesPerformed,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        var individualInfo = entry.IndividualEntries[x.Key];
                        return new Volunteer(individualInfo.ApprovalFormUploads, individualInfo.ApprovalActivitiesPerformed,
                            x.Value.IndividualRoleApprovals);
                    }));
        }
    }
}
