using CareTogether.Utilities.Telephony;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Communications
{
    public interface ICommunicationsManager
    {
        Task<ImmutableList<(Guid FamilyId, SmsMessageResult? Result)>> SendSmsToFamilyPrimaryContactsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user,
            ImmutableList<Guid> familyIds, string sourceNumber, string message);
    }
}
