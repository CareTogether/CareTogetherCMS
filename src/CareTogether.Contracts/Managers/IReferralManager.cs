using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public interface IReferralManager
    {
        Task<ImmutableList<CombinedFamilyInfo>> ListPartneringFamiliesAsync(Guid organizationId, Guid locationId);

        Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<CombinedFamilyInfo> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);

        Task<CombinedFamilyInfo> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command);
    }
}
