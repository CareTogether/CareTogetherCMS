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
        readonly IAuthorizationEngine _AuthorizationEngine;
        readonly IDirectoryResource _DirectoryResource;
        readonly IPoliciesResource _PoliciesResource;
        readonly ITelephony _Telephony;

        public CommunicationsManager(
            IAuthorizationEngine authorizationEngine,
            IDirectoryResource directoryResource,
            IPoliciesResource policiesResource,
            ITelephony telephony
        )
        {
            _AuthorizationEngine = authorizationEngine;
            _DirectoryResource = directoryResource;
            _PoliciesResource = policiesResource;
            _Telephony = telephony;
        }

        public async Task<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>> SendSmsToFamilyPrimaryContactsAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            ImmutableList<Guid> familyIds,
            string sourceNumber,
            string message
        )
        {
            if (!await _AuthorizationEngine.AuthorizeSendSmsAsync(organizationId, locationId, user))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            // Validate that the requested source number has been configured for the specified location.

            OrganizationConfiguration configuration = await _PoliciesResource.GetConfigurationAsync(organizationId);
            string? sourcePhoneNumber = configuration
                .Locations.Single(location => location.Id == locationId)
                .SmsSourcePhoneNumbers.SingleOrDefault(number => number.SourcePhoneNumber == sourceNumber)
                ?.SourcePhoneNumber;

            if (sourcePhoneNumber == null)
            {
                throw new InvalidOperationException(
                    "The specified location does not have the requested source phone number configured for SMS messages."
                );
            }

            ImmutableList<Family> families = await _DirectoryResource.ListFamiliesAsync(organizationId, locationId);

            ImmutableList<(Guid familyId, PhoneNumber? phoneNumber)> familyPrimaryContactNumbers = familyIds
                .Select(familyId =>
                {
                    Family family = families.Single(family => family.Id == familyId);
                    Person? primaryContactAdult = family
                        .Adults.Select(adult => adult.Item1)
                        .SingleOrDefault(person => person.Id == family.PrimaryFamilyContactPersonId);
                    return (
                        familyId,
                        phoneNumber: primaryContactAdult?.PhoneNumbers.SingleOrDefault(number =>
                            number.Id == primaryContactAdult.PreferredPhoneNumberId
                        )
                    );
                })
                .ToImmutableList();

            ImmutableList<string> destinationNumbers = familyPrimaryContactNumbers
                .Where(x => x.phoneNumber != null)
                .Select(x => x.phoneNumber!.Number)
                .Distinct()
                .ToImmutableList();

            ImmutableList<SmsMessageResult> sendResults = await _Telephony.SendSmsMessageAsync(
                sourcePhoneNumber,
                destinationNumbers,
                message
            );

            ImmutableList<(Guid FamilyId, SmsMessageResult? Result)> allFamilyResults = familyPrimaryContactNumbers
                .Select(x =>
                {
                    SmsMessageResult? sendResult = sendResults.SingleOrDefault(result =>
                        result.PhoneNumber == x.phoneNumber?.Number
                    );
                    return (FamilyId: x.familyId, Result: sendResult);
                })
                .ToImmutableList();

            return allFamilyResults;
        }
    }
}
