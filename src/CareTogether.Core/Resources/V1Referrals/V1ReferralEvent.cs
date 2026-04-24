using System;
using JsonPolymorph;

namespace CareTogether.Resources.V1Referrals
{
    [JsonHierarchyBase]
    public abstract partial record V1ReferralEvent(
        Guid ReferralId,
        DateTime OccurredAtUtc,
        Guid ActorUserId
    );

    public sealed record V1ReferralCommandExecuted(
        Guid ReferralId,
        V1ReferralCommand Command,
        DateTime OccurredAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, OccurredAtUtc, ActorUserId);
}
