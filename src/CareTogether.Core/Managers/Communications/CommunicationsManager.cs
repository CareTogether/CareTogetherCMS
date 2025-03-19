using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.Telephony;

namespace CareTogether.Managers.Communications
{
    public sealed class CommunicationsManager : ICommunicationsManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IDirectoryResource directoryResource;
        private readonly IPoliciesResource policiesResource;
        private readonly ITelephony telephony;


        public CommunicationsManager(IAuthorizationEngine authorizationEngine, IDirectoryResource directoryResource,
            IPoliciesResource policiesResource, ITelephony telephony)
        {
            this.authorizationEngine = authorizationEngine;
            this.directoryResource = directoryResource;
            this.policiesResource = policiesResource;
            this.telephony = telephony;
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
                        .Select(adult => adult.Item1)
                        .SingleOrDefault(person => person.Id == family.PrimaryFamilyContactPersonId);
                    return (familyId,
                        phoneNumber: primaryContactAdult?.PhoneNumbers
                            .SingleOrDefault(number => number.Id == primaryContactAdult.PreferredPhoneNumberId));
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
    }
}
