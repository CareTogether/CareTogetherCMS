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
        private readonly IDirectoryResource directoryResource;


        public ApprovalManager(IApprovalsResource approvalsResource, IPolicyEvaluationEngine policyEvaluationEngine,
            IDirectoryResource directoryResource)
        {
            this.approvalsResource = approvalsResource;
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.directoryResource = directoryResource;
        }


        public async Task<ImmutableList<VolunteerFamily>> ListVolunteerFamiliesAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId)
        {
            var families = (await directoryResource.ListFamiliesAsync(organizationId, locationId)).ToImmutableDictionary(x => x.Id);
            var volunteerFamilies = await approvalsResource.ListVolunteerFamiliesAsync(organizationId, locationId);

            var result = await volunteerFamilies.Select(vf => ToVolunteerFamilyAsync(
                organizationId, locationId, vf, families)).WhenAll();
            return result.ToImmutableList();
        }

        public async Task<VolunteerFamily> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families);

            var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerFamilyCommandAsync(
                organizationId, locationId, user, command, referral);
            
            var volunteerFamily = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families));
            return disclosedVolunteerFamily;
        }

        public async Task<VolunteerFamily> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, command.FamilyId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families);

            var authorizationResult = await policyEvaluationEngine.AuthorizeVolunteerCommandAsync(
                organizationId, locationId, user, command, referral);
            
            var volunteerFamily = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId());
            
            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamily, families));
            return disclosedVolunteerFamily;
        }

        public async Task<VolunteerFamily> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, familyId);

            //var authorizationResult = await policyEvaluationEngine.AuthorizePersonCommandAsync(
            //    organizationId, locationId, user, command, referral);

            command = command switch
            {
                AddPersonPhoneNumber c => c with { PhoneNumber = c.PhoneNumber with { Id = Guid.NewGuid() } },
                AddPersonEmailAddress c => c with { EmailAddress = c.EmailAddress with { Id = Guid.NewGuid() } },
                AddPersonAddress c => c with { Address = c.Address with { Id = Guid.NewGuid() } },
                _ => command
            };

            var person = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId, command, user.UserId());
                
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = await ToVolunteerFamilyAsync(
                organizationId, locationId, volunteerFamilyEntry, families);

            var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families));
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
                        var address = c.Address == null ? null : c.Address with { Id = Guid.NewGuid() };
                        var phoneNumber = c.PhoneNumber == null ? null : c.PhoneNumber with { Id = Guid.NewGuid() };
                        var emailAddress = c.EmailAddress == null ? null : c.EmailAddress with { Id = Guid.NewGuid() };
                        var addresses = address == null ? ImmutableList<Address>.Empty : ImmutableList<Address>.Empty.Add(address);
                        var phoneNumbers = phoneNumber == null ? ImmutableList<PhoneNumber>.Empty : ImmutableList<PhoneNumber>.Empty.Add(phoneNumber);
                        var emailAddresses = emailAddress == null ? ImmutableList<EmailAddress>.Empty : ImmutableList<EmailAddress>.Empty.Add(emailAddress);
                        
                        var createPersonSubcommand = new CreatePerson(adultPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity,
                            addresses, address?.Id,
                            phoneNumbers, phoneNumber?.Id,
                            emailAddresses, emailAddress?.Id,
                            c.Concerns, c.Notes);
                        var addAdultToFamilySubcommand = new AddAdultToFamily(c.FamilyId, adultPersonId, c.FamilyAdultRelationshipInfo);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addAdultToFamilySubcommand, user.UserId());

                        var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);

                        var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families));
                        return disclosedVolunteerFamily;
                    }
                case AddChildToFamilyCommand c:
                    {
                        var childPersonId = Guid.NewGuid();
                        var createPersonSubcommand = new CreatePerson(childPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity,
                            ImmutableList<Address>.Empty, null,
                            ImmutableList<PhoneNumber>.Empty, null,
                            ImmutableList<EmailAddress>.Empty, null,
                            c.Concerns, c.Notes);
                        var addChildToFamilySubcommand = new AddChildToFamily(c.FamilyId, childPersonId, c.CustodialRelationships.Select(cr =>
                            cr with { ChildId = childPersonId }).ToImmutableList());

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addChildToFamilySubcommand, user.UserId());
                            
                        var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);

                        var volunteerFamilyEntry = await approvalsResource.GetVolunteerFamilyAsync(organizationId, locationId, c.FamilyId);
                                
                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families));
                        return disclosedVolunteerFamily;
                    }
                case CreateVolunteerFamilyWithNewAdultCommand c:
                    {
                        var adultPersonId = Guid.NewGuid();
                        var familyId = Guid.NewGuid();
                        var address = c.Address == null ? null : c.Address with { Id = Guid.NewGuid() };
                        var phoneNumber = c.PhoneNumber == null ? null : c.PhoneNumber with { Id = Guid.NewGuid() };
                        var emailAddress = c.EmailAddress == null ? null : c.EmailAddress with { Id = Guid.NewGuid() };
                        var addresses = address == null ? ImmutableList<Address>.Empty : ImmutableList<Address>.Empty.Add(address);
                        var phoneNumbers = phoneNumber == null ? ImmutableList<PhoneNumber>.Empty : ImmutableList<PhoneNumber>.Empty.Add(phoneNumber);
                        var emailAddresses = emailAddress == null ? ImmutableList<EmailAddress>.Empty : ImmutableList<EmailAddress>.Empty.Add(emailAddress);
                        
                        var createPersonSubcommand = new CreatePerson(adultPersonId, null, c.FirstName, c.LastName,
                            c.Gender, c.Age, c.Ethnicity,
                            addresses, address?.Id,
                            phoneNumbers, phoneNumber?.Id,
                            emailAddresses, emailAddress?.Id,
                            c.Concerns, c.Notes);
                        var createFamilySubcommand = new CreateFamily(familyId, adultPersonId,
                            ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add((adultPersonId, c.FamilyAdultRelationshipInfo)),
                            ImmutableList<Guid>.Empty,
                            ImmutableList<CustodialRelationship>.Empty);
                        var activateVolunteerFamilySubcommand = new ActivateVolunteerFamily(familyId);

                        //TODO: Authorize the subcommands via the policy evaluation engine

                        var person = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());
                        
                        var family = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            createFamilySubcommand, user.UserId());

                        var volunteerFamilyEntry = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId,
                            activateVolunteerFamilySubcommand, user.UserId());

                        var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);

                        var disclosedVolunteerFamily = await policyEvaluationEngine.DiscloseVolunteerFamilyAsync(user,
                            await ToVolunteerFamilyAsync(organizationId, locationId, volunteerFamilyEntry, families));
                        return disclosedVolunteerFamily;
                    }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.");
            }
        }


        private async Task<VolunteerFamily> ToVolunteerFamilyAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyEntry entry,
            ImmutableDictionary<Guid, Family> families)
        {
            var family = families[entry.FamilyId];
            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements);
            var removedIndividualRoles = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.RemovedRoles);

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, entry.CompletedRequirements, entry.RemovedRoles,
                completedIndividualRequirements, removedIndividualRoles);

            return new VolunteerFamily(family,
                entry.CompletedRequirements, entry.UploadedDocuments, entry.RemovedRoles,
                volunteerFamilyApprovalStatus.MissingFamilyRequirements,
                volunteerFamilyApprovalStatus.AvailableFamilyApplications,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        var hasEntry = entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        var result = hasEntry
                            ? new Volunteer(individualEntry!.CompletedRequirements, individualEntry!.RemovedRoles,
                                x.Value.MissingIndividualRequirements, x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals)
                            : new Volunteer(ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<RemovedRole>.Empty,
                                x.Value.MissingIndividualRequirements, x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals);
                        return result;
                    }));
        }
    }
}
