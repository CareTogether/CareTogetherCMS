using CareTogether.Engines.Authorization;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using CareTogether.Utilities.Telephony;
using Nito.AsyncEx;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Records
{
    public sealed class RecordsManager : IRecordsManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IDirectoryResource directoryResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly IReferralsResource referralsResource;
        private readonly INotesResource notesResource;
        private readonly IPoliciesResource policiesResource;
        private readonly ITelephony telephony;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;


        public RecordsManager(IAuthorizationEngine authorizationEngine, IDirectoryResource directoryResource,
            IApprovalsResource approvalsResource, IReferralsResource referralsResource, INotesResource notesResource,
            IPoliciesResource policiesResource, ITelephony telephony, CombinedFamilyInfoFormatter combinedFamilyInfoFormatter)
        {
            this.authorizationEngine = authorizationEngine;
            this.directoryResource = directoryResource;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.notesResource = notesResource;
            this.policiesResource = policiesResource;
            this.telephony = telephony;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }


        public async Task<ImmutableList<CombinedFamilyInfo>> ListVisibleFamiliesAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId)
        {
            var families = await directoryResource.ListFamiliesAsync(organizationId, locationId);

            var visibleFamilies = (await families.Select(async family =>
                {
                    var permissions = await authorizationEngine.AuthorizeUserAccessAsync(organizationId, locationId, user,
                        new FamilyAuthorizationContext(family.Id));
                    return (family, hasPermissions: !permissions.IsEmpty);
                })
                .WhenAll())
                .Where(x => x.hasPermissions)
                .Select(x => x.family)
                .Cast<Family>()
                .ToImmutableList();

            var result = await visibleFamilies
                .Select(family => combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, family.Id, user))
                .WhenAll();
            return result.ToImmutableList();
        }

        public async Task<CombinedFamilyInfo> ExecuteDirectoryCommandAsync(Guid organizationId, Guid locationId,
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

                        if (!await authorizationEngine.AuthorizePersonCommandAsync(
                            organizationId, locationId, user, c.FamilyId, createPersonSubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeFamilyCommandAsync(
                            organizationId, locationId, user, addAdultToFamilySubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        _ = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());

                        _ = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addAdultToFamilySubcommand, user.UserId());

                        var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, c.FamilyId, user);
                        return familyResult;
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

                        if (!await authorizationEngine.AuthorizePersonCommandAsync(
                            organizationId, locationId, user, c.FamilyId, createPersonSubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeFamilyCommandAsync(
                            organizationId, locationId, user, addChildToFamilySubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        _ = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());

                        _ = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            addChildToFamilySubcommand, user.UserId());

                        var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, c.FamilyId, user);
                        return familyResult;
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

                        if (!await authorizationEngine.AuthorizePersonCommandAsync(
                            organizationId, locationId, user, familyId, createPersonSubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeFamilyCommandAsync(
                            organizationId, locationId, user, createFamilySubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                            organizationId, locationId, user, activateVolunteerFamilySubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        _ = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());

                        _ = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            createFamilySubcommand, user.UserId());

                        _ = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId,
                            activateVolunteerFamilySubcommand, user.UserId());

                        var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, familyId, user);
                        return familyResult;
                    }
                case CreatePartneringFamilyWithNewAdultCommand c:
                    {
                        var adultPersonId = Guid.NewGuid();
                        var familyId = Guid.NewGuid();
                        var referralId = Guid.NewGuid();
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
                        var createReferralSubcommand = new CreateReferral(familyId, referralId, c.ReferralOpenedAtUtc);

                        if (!await authorizationEngine.AuthorizePersonCommandAsync(
                            organizationId, locationId, user, familyId, createPersonSubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeFamilyCommandAsync(
                            organizationId, locationId, user, createFamilySubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        if (!await authorizationEngine.AuthorizeReferralCommandAsync(
                            organizationId, locationId, user, createReferralSubcommand))
                            throw new Exception("The user is not authorized to perform this command.");

                        _ = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId,
                            createPersonSubcommand, user.UserId());

                        _ = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId,
                            createFamilySubcommand, user.UserId());

                        _ = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId,
                            createReferralSubcommand, user.UserId());

                        var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, familyId, user);
                        return familyResult;
                    }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.");
            }
        }

        public async Task<CombinedFamilyInfo> ExecuteFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, FamilyCommand command)
        {
            if (!await authorizationEngine.AuthorizeFamilyCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await directoryResource.ExecuteFamilyCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecutePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            command = command switch
            {
                AddPersonPhoneNumber c => c with { PhoneNumber = c.PhoneNumber with { Id = Guid.NewGuid() } },
                AddPersonEmailAddress c => c with { EmailAddress = c.EmailAddress with { Id = Guid.NewGuid() } },
                AddPersonAddress c => c with { Address = c.Address with { Id = Guid.NewGuid() } },
                _ => command
            };

            if (!await authorizationEngine.AuthorizePersonCommandAsync(
                organizationId, locationId, user, familyId, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await directoryResource.ExecutePersonCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, familyId, user);
            return familyResult;
        }

        public async Task<NoteCommandResult> ExecuteNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, NoteCommand command)
        {
            command = command switch
            {
                CreateDraftNote c => c with { NoteId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeNoteCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            var noteEntry = await notesResource.ExecuteNoteCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);

            var note = familyResult.Notes.SingleOrDefault(note => note.Id == noteEntry?.Id);
            return new NoteCommandResult(familyResult, note);
        }

        public async Task<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>> SendSmsToFamilyPrimaryContactsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user,
            ImmutableList<Guid> familyIds, string sourceNumber, string message)
        {
            if (!await authorizationEngine.AuthorizeSendSmsAsync(organizationId, locationId, user))
                throw new Exception("The user is not authorized to perform this command.");

            // Validate that the requested source number has been configured for the specified location.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            var sourcePhoneNumber = configuration.Locations
                .Single(location => location.Id == locationId)
                .SmsSourcePhoneNumbers.SingleOrDefault(number => number.SourcePhoneNumber == sourceNumber)
                ?.SourcePhoneNumber;

            if (sourcePhoneNumber == null)
                throw new InvalidOperationException(
                    "The specified location does not have the requested source phone number configured for SMS messages.");

            var families = await directoryResource.ListFamiliesAsync(organizationId, locationId);

            var familyPrimaryContactNumbers = familyIds
                .Select(familyId =>
                {
                    var family = families.Single(family => family.Id == familyId);
                    var primaryContactAdult = family.Adults
                        .Single(adult => adult.Item1.Id == family.PrimaryFamilyContactPersonId);
                    return (familyId,
                        phoneNumber: primaryContactAdult.Item1.PhoneNumbers
                            .SingleOrDefault(number => number.Id == primaryContactAdult.Item1.PreferredPhoneNumberId));
                }).ToImmutableList();

            var destinationNumbers = familyPrimaryContactNumbers
                .Where(x => x.phoneNumber != null)
                .Select(x => x.phoneNumber!.Number)
                .Distinct()
                .ToImmutableList();

            var sendResults = await telephony.SendSmsMessageAsync(sourcePhoneNumber, destinationNumbers, message);

            var allFamilyResults = familyPrimaryContactNumbers.Select(x =>
            {
                var sendResult = sendResults.SingleOrDefault(result => result.PhoneNumber == x.phoneNumber?.Number);
                return (FamilyId: x.familyId, Result: sendResult);
            }).ToImmutableList();

            return allFamilyResults;
        }
        public async Task<CombinedFamilyInfo> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            command = command switch
            {
                CompleteVolunteerFamilyRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command)
        {
            command = command switch
            {
                CompleteVolunteerRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeVolunteerCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command)
        {
            command = command switch
            {
                CreateReferral c => c with { ReferralId = Guid.NewGuid() },
                CompleteReferralRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                UpdateCustomReferralField c => c with { CompletedCustomFieldId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeReferralCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecuteArrangementsCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementsCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementIds = ImmutableList.Create(Guid.NewGuid()) },
                CompleteArrangementRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeArrangementsCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await referralsResource.ExecuteArrangementsCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }
    }
}
