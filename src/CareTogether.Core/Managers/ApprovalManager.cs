using CareTogether.Engines;
using CareTogether.Resources;
using Nito.AsyncEx;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ApprovalManager : IApprovalManager
    {
        private readonly IApprovalsResource approvalsResource;
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly ICommunitiesResource communitiesResource;
        private readonly IContactsResource contactsResource;


        public ApprovalManager(IApprovalsResource approvalsResource, IPolicyEvaluationEngine policyEvaluationEngine,
            ICommunitiesResource communitiesResource, IContactsResource contactsResource)
        {
            this.approvalsResource = approvalsResource;
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.communitiesResource = communitiesResource;
            this.contactsResource = contactsResource;
        }


        public async Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(AuthorizedUser user, Guid organizationId, Guid locationId)
        {
            var families = (await communitiesResource.ListFamiliesAsync(organizationId, locationId)).ToImmutableDictionary(x => x.Id);
            var contacts = await contactsResource.ListContactsAsync(organizationId, locationId);
            var volunteerFamilies = await approvalsResource.ListVolunteerFamiliesAsync(organizationId, locationId);

            var result = await volunteerFamilies.Select(vf => ToVolunteerFamilyAsync(
                organizationId, locationId, vf, families, contacts)).WhenAll();
            return result.ToImmutableList();
        }

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command)
        {
            var getVolunteerFamilyResult = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
            {
                var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = await ToVolunteerFamilyAsync(
                    organizationId, locationId, volunteerFamilyEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerFamilyCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId);
                    if (commandResult.TryPickT0(out var volunteerFamily, out var commandError))
                    {
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families, contacts));
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
            var getVolunteerFamilyResult = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            if (getVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound))
            {
                var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = await ToVolunteerFamilyAsync(
                    organizationId, locationId, volunteerFamilyEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId);
                    if (commandResult.TryPickT0(out var volunteerFamily, out var commandError))
                    {
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families, contacts));
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
