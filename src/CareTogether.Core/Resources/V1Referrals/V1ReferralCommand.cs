using System;
using JsonPolymorph;

namespace CareTogether.Resources.V1Referrals
{
    [JsonHierarchyBase]
    public abstract partial record V1ReferralCommand(
        Guid ReferralId
    );

    public sealed record CreateV1Referral(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        string? Comment
    ) : V1ReferralCommand(ReferralId);

    public sealed record UpdateV1ReferralFamily(
        Guid ReferralId,
        Guid FamilyId
    ) : V1ReferralCommand(ReferralId);

    public sealed record CloseV1Referral(
        Guid ReferralId,
        DateTime ClosedAtUtc,
        string CloseReason
    ) : V1ReferralCommand(ReferralId);

    public sealed record ReopenV1Referral(
        Guid ReferralId,
        DateTime ReopenedAtUtc
    ) : V1ReferralCommand(ReferralId);
    public sealed record UpdateV1ReferralDetails(
        Guid ReferralId,
        Guid? FamilyId,
        string Title,
        string? Comment,
        DateTime CreatedAtUtc
    ) : V1ReferralCommand(ReferralId);
}
