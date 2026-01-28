using System;
using System.Threading.Tasks;
using System.Collections.Immutable;


namespace CareTogether.Resources.V1Referrals
{
    public interface IV1ReferralsResource
    {
        Task ExecuteV1ReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command,
            Guid actorUserId
        );

        Task<V1Referral?> GetReferralAsync(
            Guid organizationId,
            Guid locationId,
            Guid referralId
        );

        Task<ImmutableList<V1Referral>> ListReferralsAsync(
            Guid organizationId,
            Guid locationId
        );

        Task<V1Referral?> GetOpenReferralForFamilyAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId
        );
    }
}
