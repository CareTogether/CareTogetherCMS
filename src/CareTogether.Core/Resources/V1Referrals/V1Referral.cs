using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.Policies;

namespace CareTogether.Resources.V1Referrals
{
    public sealed record V1Referral(
        Guid ReferralId,
        Guid? FamilyId,
        DateTime CreatedAtUtc,
        string Title,
        V1ReferralStatus Status,
        string? Comment,
        DateTime? AcceptedAtUtc,
        DateTime? ClosedAtUtc,
        string? CloseReason,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields
    )
    {
        public static V1Referral Rehydrate(IEnumerable<V1ReferralEvent> events)
        {
            V1Referral? referral = null;

            foreach (var e in events.OrderBy(e => e.OccurredAtUtc))
            {
                if (e is not V1ReferralCommandExecuted executed)
                    continue;

                referral = ApplyCommand(referral, executed.Command);
            }

            if (referral == null)
                throw new InvalidOperationException(
                    "This referral is missing its creation command."
                );

            return referral;
        }

        public static V1Referral ApplyCommand(
            V1Referral? referral,
            V1ReferralCommand command
        )
        {
            return command switch
            {
                CreateV1Referral c => referral == null
                    ? new V1Referral(
                        c.ReferralId,
                        c.FamilyId,
                        c.CreatedAtUtc,
                        c.Title,
                        V1ReferralStatus.Open,
                        c.Comment,
                        null,
                        null,
                        null,
                        ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty
                    )
                    : throw new InvalidOperationException("Referral already exists."),

                UpdateV1ReferralFamily c => EnsureExists(referral) with
                {
                    FamilyId = c.FamilyId
                },

                UpdateV1ReferralDetails c => EnsureOpen(referral!) with
                {
                    Title = c.Title,
                    Comment = c.Comment,
                    CreatedAtUtc = c.CreatedAtUtc
                },

                AcceptV1Referral c => EnsureOpen(referral!) with
                {
                    Status = V1ReferralStatus.Accepted,
                    AcceptedAtUtc = c.AcceptedAtUtc
                },

                CloseV1Referral c => EnsureOpen(referral!) with
                {
                    Status = V1ReferralStatus.Closed,
                    ClosedAtUtc = c.ClosedAtUtc,
                    CloseReason = c.CloseReason
                },

                ReopenV1Referral => EnsureExists(referral!) with
                {
                    Status = V1ReferralStatus.Open,
                    AcceptedAtUtc = null,
                    ClosedAtUtc = null,
                    CloseReason = null
                },

                UpdateCustomV1ReferralField c => EnsureOpen(referral!) with
                {
                    CompletedCustomFields =
                        referral!.CompletedCustomFields.SetItem(
                            c.CustomFieldName,
                            new CompletedCustomFieldInfo(
                                Guid.Empty,
                                DateTime.UtcNow,
                                c.CompletedCustomFieldId,
                                c.CustomFieldName,
                                c.CustomFieldType,
                                c.Value
                            )
                        )
                },

                _ => throw new InvalidOperationException(
                    $"Unsupported referral command: {command.GetType().Name}"
                )
            };
        }

        private static V1Referral EnsureExists(V1Referral? referral)
        {
            if (referral == null)
                throw new InvalidOperationException("Referral does not exist.");

            return referral;
        }

        private static V1Referral EnsureOpen(V1Referral referral)
        {
            if (referral.Status != V1ReferralStatus.Open)
                throw new InvalidOperationException("Referral is not open.");

            return referral;
        }
    }
}
