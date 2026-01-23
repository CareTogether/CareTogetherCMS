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
        V1ReferralCloseReason? CloseReason,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields
    )
    {
        public static V1Referral Rehydrate(IEnumerable<V1ReferralEvent> events)
        {
            V1Referral? referral = null;

            foreach (var e in events
                .OrderBy(e => e is V1ReferralCreated ? 0 : 1)
                .ThenBy(e => e.OccurredAtUtc))
            {
                referral = e switch
                {
                    V1ReferralCreated created => new V1Referral(
                        created.ReferralId,
                        created.FamilyId,
                        created.CreatedAtUtc,
                        created.Title,
                        V1ReferralStatus.Open,
                        created.Comment,
                        null,
                        null,
                        null,
                        ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty
                    ),

                    _ when referral == null => referral,

                    V1ReferralFamilyUpdated updated => referral with
                    {
                        FamilyId = updated.FamilyId
                    },

                    V1ReferralDetailsUpdated updated => referral with
                    {
                        FamilyId = updated.FamilyId,
                        Title = updated.Title,
                        Comment = updated.Comment,
                        CreatedAtUtc = updated.CreatedAtUtc
                    },

                    V1ReferralAccepted accepted => referral with
                    {
                        Status = V1ReferralStatus.Accepted,
                        FamilyId = accepted.FamilyId,
                        AcceptedAtUtc = accepted.AcceptedAtUtc
                    },

                    V1ReferralClosed closed => ApplyClosed(referral, closed),

                    V1ReferralReopened => referral with
                    {
                        Status = V1ReferralStatus.Open,
                        FamilyId = null,
                        AcceptedAtUtc = null,
                        ClosedAtUtc = null,
                        CloseReason = null
                    },

                    V1ReferralCustomFieldUpdated cf => referral with
                    {
                        CompletedCustomFields =
                            referral.CompletedCustomFields.SetItem(
                                cf.CustomFieldName,
                                new CompletedCustomFieldInfo(
                                    cf.ActorUserId,
                                    cf.UpdatedAtUtc,
                                    cf.CompletedCustomFieldId,
                                    cf.CustomFieldName,
                                    cf.CustomFieldType,
                                    cf.Value
                                )
                            )
                    },

                    _ => referral
                };
            }

            if (referral == null)
                throw new InvalidOperationException(
                    "This referral is missing its creation event."
                );

            return referral;
        }

        private static V1Referral ApplyClosed(
            V1Referral referral,
            V1ReferralClosed closed
        )
        {
            return referral with
            {
                Status = V1ReferralStatus.Closed,
                ClosedAtUtc = closed.ClosedAtUtc,
                CloseReason = closed.CloseReason
            };
        }
    }
}
