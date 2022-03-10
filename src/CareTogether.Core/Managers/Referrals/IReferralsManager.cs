using CareTogether.Resources;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Referrals
{
    public interface IReferralsManager
    {
        Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<CombinedFamilyInfo> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);
    }
}
