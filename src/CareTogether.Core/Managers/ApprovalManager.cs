using CareTogether.Engines;
using CareTogether.Resources;
using Nito.AsyncEx;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
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


        public async Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId)
        {
            var families = (await communitiesResource.ListFamiliesAsync(organizationId, locationId)).ToImmutableDictionary(x => x.Id);
            var contacts = await contactsResource.ListContactsAsync(organizationId, locationId);
            var volunteerFamilies = await approvalsResource.ListVolunteerFamiliesAsync(organizationId, locationId);

            var result = await volunteerFamilies.Select(vf => ToVolunteerFamilyAsync(
                organizationId, locationId, vf, families, contacts)).WhenAll();
            return result.ToImmutableList();
        }

        public async Task<ManagerResult<VolunteerFamily>> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command)
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
                    var commandResult = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId());
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
            ClaimsPrincipal user, VolunteerCommand command)
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
                    var commandResult = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId());
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
        public async Task<ManagerResult<VolunteerFamily>> ExecuteApprovalCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ApprovalCommand command)
        {
            switch (command)
            {
                case AddAdultToFamilyCommand c:
                    {
                        var adultPersonId = Guid.NewGuid();
                        var createPersonSubcommand = new CreatePerson(adultPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity, c.Concerns, c.Notes);
                        var addAdultToFamilySubcommand = new AddAdultToFamily(c.FamilyId, adultPersonId, c.FamilyAdultRelationshipInfo);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var createPersonResult = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        if (createPersonResult.TryPickT0(out var person, out var notFound1))
                        {
                            var addPersonToFamilyResult = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                                addAdultToFamilySubcommand, user.UserId());
                            if (addPersonToFamilyResult.TryPickT0(out var family, out var notFound2))
                            {
                                var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                                var volunteerFamilyResult = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                if (volunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound3))
                                {
                                    var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                                        await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                                    return disclosedVolunteerFamily;
                                }
                            }
                        }
                        break;
                    }
                case AddChildToFamilyCommand c:
                    {
                        var childPersonId = Guid.NewGuid();
                        var createPersonSubcommand = new CreatePerson(childPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity, c.Concerns, c.Notes);
                        var addChildToFamilySubcommand = new AddChildToFamily(c.FamilyId, childPersonId, c.CustodialRelationships.Select(cr =>
                            cr with { ChildId = childPersonId }).ToList());

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var createPersonResult = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        if (createPersonResult.TryPickT0(out var person, out var notFound1))
                        {
                            var addChildToFamilyResult = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                                addChildToFamilySubcommand, user.UserId());
                            if (addChildToFamilyResult.TryPickT0(out var family, out var notFound2))
                            {
                                var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                                var volunteerFamilyResult = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                if (volunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound3))
                                {
                                    var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                                        await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                                    return disclosedVolunteerFamily;
                                }
                            }
                        }
                        break;
                    }
                case CreateVolunteerFamilyWithNewAdultCommand c:
                    {
                        var adultPersonId = Guid.NewGuid();
                        var familyId = Guid.NewGuid();
                        var createPersonSubcommand = new CreatePerson(adultPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity, c.Concerns, c.Notes);
                        var createFamilySubcommand = new CreateFamily(familyId, adultPersonId,
                            new List<(Guid, FamilyAdultRelationshipInfo)>
                            {
                                (adultPersonId, c.FamilyAdultRelationshipInfo)
                            }, new List<Guid>(), new List<CustodialRelationship>());
                        var activateVolunteerFamilySubcommand = new ActivateVolunteerFamily(familyId);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var createPersonResult = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        if (createPersonResult.TryPickT0(out var person, out var notFound1))
                        {
                            var createFamilyResult = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                                createFamilySubcommand, user.UserId());
                            if (createFamilyResult.TryPickT0(out var family, out var notFound2))
                            {
                                var activateVolunteerFamilyResult = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId,
                                    activateVolunteerFamilySubcommand, user.UserId());
                                if (activateVolunteerFamilyResult.TryPickT0(out var volunteerFamilyEntry, out var notFound3))
                                {
                                    var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                                    var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                                    var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                                        await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                                    return disclosedVolunteerFamily;
                                }
                            }
                        }
                        break;
                    }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.");
            }

            return ManagerResult.NotFound; //TODO: Pass-through reason code?
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
                        if (entry.IndividualEntries.TryGetValue(x.Key, out var individualInfo))
                            return new Volunteer(individualInfo.ApprovalFormUploads, individualInfo.ApprovalActivitiesPerformed,
                                x.Value.IndividualRoleApprovals);
                        else
                            return new Volunteer(ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty,
                                ImmutableDictionary<string, RoleApprovalStatus>.Empty);
                    }));
        }
    }
}
