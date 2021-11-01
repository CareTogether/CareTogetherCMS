using CareTogether.Engines;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class DirectoryManager : IDirectoryManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IDirectoryResource directoryResource;


        public DirectoryManager(IPolicyEvaluationEngine policyEvaluationEngine, IAuthorizationEngine authorizationEngine,
            IDirectoryResource directoryResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.directoryResource = directoryResource;
        }


        public async Task<Family> ExecuteDirectoryCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, DirectoryCommand command)
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

                        var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);
                        return disclosedFamily;
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

                        var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);
                        return disclosedFamily;
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

                        var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);
                        return disclosedFamily;
                    }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.");
            }
        }

        public async Task<Family> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
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

            var family = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);

            var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);
            return disclosedFamily;
        }
    }
}
