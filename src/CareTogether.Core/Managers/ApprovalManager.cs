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

        public async Task<VolunteerFamily> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            
            var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families, contacts);

            var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerFamilyCommandAsync(
                organizationId, locationId, user, command, referral);
            
            var volunteerFamily = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families, contacts));
            return disclosedVolunteerFamily;
        }

        public async Task<VolunteerFamily> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            
            var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families, contacts);

            var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerCommandAsync(
                organizationId, locationId, user, command, referral);
            
            var volunteerFamily = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId());
            
            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families, contacts));
            return disclosedVolunteerFamily;
        }

        public async Task<VolunteerFamily> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, familyId);
            
            //var authorizationResult = await policyEvaluationEngine.AuthorizePersonCommandAsync(
            //    organizationId, locationId, user, command, referral);

            var person = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId, command, user.UserId());
                
            var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families, contacts);

            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
            return disclosedVolunteerFamily;
        }

        public async Task<VolunteerFamily> ExecuteApprovalCommandAsync(Guid organizationId, Guid locationId,
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
                        var addContactAddressSubcommand = c.Address == null ? null : new AddContactAddress(adultPersonId,
                            c.Address with { Id = Guid.NewGuid() }, IsCurrentAddress: true);
                        var addContactPhoneNumberSubcommand = c.PhoneNumber == null ? null :  new AddContactPhoneNumber(adultPersonId,
                            c.PhoneNumber with { Id = Guid.NewGuid() }, IsPreferredPhoneNumber: true);
                        var addContactEmailAddressSubcommand = c.EmailAddress == null ? null : new AddContactEmailAddress(adultPersonId,
                            c.EmailAddress with { Id = Guid.NewGuid() }, IsPreferredEmailAddress: true);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addAdultToFamilySubcommand, user.UserId());

                        if (addContactAddressSubcommand != null)
                            await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactAddressSubcommand, user.UserId());
                        if (addContactPhoneNumberSubcommand != null)
                            await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactPhoneNumberSubcommand, user.UserId());
                        if (addContactEmailAddressSubcommand != null)
                            await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactEmailAddressSubcommand, user.UserId());

                        var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                        var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                        var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                        return disclosedVolunteerFamily;
                    }
                case AddChildToFamilyCommand c:
                    {
                        var childPersonId = Guid.NewGuid();
                        var createPersonSubcommand = new CreatePerson(childPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity, c.Concerns, c.Notes);
                        var addChildToFamilySubcommand = new AddChildToFamily(c.FamilyId, childPersonId, c.CustodialRelationships.Select(cr =>
                            cr with { ChildId = childPersonId }).ToList());

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addChildToFamilySubcommand, user.UserId());
                            
                        var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                        var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                        var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                        return disclosedVolunteerFamily;
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
                        var addContactAddressSubcommand = new AddContactAddress(adultPersonId,
                            c.Address with { Id = Guid.NewGuid() }, IsCurrentAddress: true);
                        var addContactPhoneNumberSubcommand = new AddContactPhoneNumber(adultPersonId,
                            c.PhoneNumber with { Id = Guid.NewGuid() }, IsPreferredPhoneNumber: true);
                        var addContactEmailAddressSubcommand = new AddContactEmailAddress(adultPersonId,
                            c.EmailAddress with { Id = Guid.NewGuid() }, IsPreferredEmailAddress: true);
                        var activateVolunteerFamilySubcommand = new ActivateVolunteerFamily(familyId);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await communitiesResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await communitiesResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            createFamilySubcommand, user.UserId());

                        await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactAddressSubcommand, user.UserId());
                        await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactPhoneNumberSubcommand, user.UserId());
                        await contactsResource.ExecuteContactCommandAsync(organizationId, locationId, addContactEmailAddressSubcommand, user.UserId());
                        
                        var volunteerFamilyEntry = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId,
                            activateVolunteerFamilySubcommand, user.UserId());

                        var families = communitiesResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                        var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;

                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families, contacts));
                        return disclosedVolunteerFamily;
                    }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.");
            }
        }


        private async Task<VolunteerFamily> ToVolunteerFamilyAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyEntry entry,
            ImmutableDictionary<Guid, Family> families,
            ImmutableDictionary<Guid, ContactInfo> contacts)
        {
            var family = families[entry.FamilyId];
            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements);

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, entry.CompletedRequirements, completedIndividualRequirements);

            return new VolunteerFamily(family,
                entry.CompletedRequirements, entry.UploadedDocuments,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x => entry.IndividualEntries.TryGetValue(x.Key, out var individualInfo)
                        ? new Volunteer(individualInfo.CompletedRequirements,
                            x.Value.IndividualRoleApprovals)
                        : new Volunteer(ImmutableList<CompletedRequirementInfo>.Empty,
                            ImmutableDictionary<(string Role, string Version), RoleApprovalStatus>.Empty)),
                family.Adults.SelectMany(x => contacts.TryGetValue(x.Item1.Id, out var contactInfo)
                    ? new KeyValuePair<Guid, ContactInfo>[] { new KeyValuePair<Guid, ContactInfo>(x.Item1.Id, contactInfo) }
                    : new KeyValuePair<Guid, ContactInfo>[] { }).ToImmutableDictionary());
        }
    }
}
