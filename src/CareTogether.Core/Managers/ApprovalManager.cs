using CareTogether.Abstractions;
using CareTogether.Engines;
using CareTogether.Resources;
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
        private readonly IProfilesResource profilesResource;


        public ApprovalManager(IMultitenantEventLog<ApprovalEvent> eventLog, IPolicyEvaluationEngine policyEvaluationEngine,
            ICommunitiesResource communitiesResource, IProfilesResource profilesResource)
        {
            this.eventLog = eventLog;
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.communitiesResource = communitiesResource;
            this.profilesResource = profilesResource;
        }


        public async Task<IImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(AuthorizedUser user, Guid organizationId, Guid locationId)
        {
            var tenantModel = await GetTenantModelAsync(organizationId, locationId);

            var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;

            var volunteerFamilies = tenantModel.FindVolunteerFamilyEntries(_ => true);
            return volunteerFamilies.Select(vf => ToVolunteerFamily(vf, families, contacts)).ToImmutableList();
        }

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command)
        {
            var tenantModel = await GetTenantModelAsync(organizationId, locationId);

            var getVolunteerFamilyResult = tenantModel.GetVolunteerFamilyEntry(command.FamilyId);
            if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
            {
                var families = communitiesResource.ListVolunteerFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = ToVolunteerFamily(volunteerFamilyEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerFamilyCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = tenantModel.ExecuteVolunteerFamilyCommand(command);
                    if (commandResult.TryPickT0(out var success, out var commandError))
                    {
                        await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                        success.Value.OnCommit();
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            ToVolunteerFamily(success.Value.VolunteerFamilyEntry, families, contacts));
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

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command)
        {
            var tenantModel = await GetTenantModelAsync(organizationId, locationId);

            var getVolunteerFamilyResult = tenantModel.GetVolunteerFamilyEntry(command.FamilyId);
            if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
            {
                var families = communitiesResource.ListVolunteerFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = ToVolunteerFamily(volunteerFamilyEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = tenantModel.ExecuteVolunteerCommand(command);
                    if (commandResult.TryPickT0(out var success, out var commandError))
                    {
                        await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                        success.Value.OnCommit();
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            ToVolunteerFamily(success.Value.VolunteerFamilyEntry, families, contacts));
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


        private async Task<ApprovalModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ApprovalModel>(() =>
                ApprovalModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }

        private VolunteerFamily ToVolunteerFamily(VolunteerFamilyEntry entry,
            IImmutableDictionary<Guid, Family> families,
            IImmutableDictionary<Guid, ContactInfo> contacts) =>
            new(families[entry.FamilyId],
                ImmutableList < (string, VolunteerRoleApprovalStatus) >.Empty,//TODO: !!!
                ImmutableDictionary < Guid, ImmutableList < (string, VolunteerRoleApprovalStatus) >>.Empty); //TODO: !!!
                //entry.Id, entry.PolicyVersion, entry.TimestampUtc, entry.CloseReason,
                //families[entry.PartneringFamilyId],
                //families[entry.PartneringFamilyId].Adults
                //    .Select(a => contacts.TryGetValue(a.Item1.Id, out var c) ? c : null)
                //    .Where(c => c != null)
                //    .ToImmutableList(),
                //entry.ReferralFormUploads, entry.ReferralActivitiesPerformed,
                //entry.Arrangements.Select(a => ToArrangement(a.Value)).ToImmutableList());

        //private Arrangement ToArrangement(ArrangementEntry entry) =>
        //    new(entry.Id, entry.PolicyVersion, entry.ArrangementType, entry.State,
        //        entry.ArrangementFormUploads, entry.ArrangementActivitiesPerformed, entry.VolunteerAssignments,
        //        entry.PartneringFamilyChildAssignments, entry.ChildrenLocationHistory,
        //        ImmutableList<Note>.Empty); //TODO: Look up note contents
    }
}
