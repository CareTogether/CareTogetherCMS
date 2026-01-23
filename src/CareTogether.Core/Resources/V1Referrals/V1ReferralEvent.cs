using System;
using JsonPolymorph;
using CareTogether.Resources.Policies;

namespace CareTogether.Resources.V1Referrals
{
    [JsonHierarchyBase]
    public abstract partial record V1ReferralEvent(
        Guid ReferralId,
        DateTime OccurredAtUtc,
        Guid ActorUserId
    );

    public sealed record V1ReferralCreated(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        string? Comment,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, CreatedAtUtc, ActorUserId);

    public sealed record V1ReferralFamilyUpdated(
        Guid ReferralId,
        Guid FamilyId,
        DateTime UpdatedAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, UpdatedAtUtc, ActorUserId);


    public sealed record V1ReferralAccepted(
        Guid ReferralId,
        DateTime AcceptedAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, AcceptedAtUtc, ActorUserId);

public sealed record V1ReferralClosed(
    Guid ReferralId,
    DateTime ClosedAtUtc,
    V1ReferralCloseReason CloseReason,
    Guid ActorUserId
) : V1ReferralEvent(ReferralId, ClosedAtUtc, ActorUserId);

    public sealed record V1ReferralReopened(
        Guid ReferralId,
        DateTime ReopenedAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, ReopenedAtUtc, ActorUserId);

    public sealed record V1ReferralDetailsUpdated(
        Guid ReferralId,
        Guid? FamilyId,
        string Title,
        string? Comment,
        DateTime CreatedAtUtc,
        DateTime UpdatedAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, UpdatedAtUtc, ActorUserId);

    public sealed record V1ReferralCustomFieldUpdated(
        Guid ReferralId,
        Guid CompletedCustomFieldId,
        string CustomFieldName,
        CustomFieldType CustomFieldType,
        object? Value,
        DateTime UpdatedAtUtc,
        Guid ActorUserId
    ) : V1ReferralEvent(ReferralId, UpdatedAtUtc, ActorUserId);
}
