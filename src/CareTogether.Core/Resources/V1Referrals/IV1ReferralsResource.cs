using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

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

        Task<V1Referral?> GetReferralAsync(Guid organizationId, Guid locationId, Guid referralId);

        Task<ImmutableList<V1Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);
    }
}
