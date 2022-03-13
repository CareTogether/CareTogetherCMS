using CareTogether.Resources;
using CareTogether.Resources.Referrals;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Referrals
{
    public interface IReferralsManager
    {
        Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<CombinedFamilyInfo> ExecuteArrangementsCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementsCommand command);
    }
}
