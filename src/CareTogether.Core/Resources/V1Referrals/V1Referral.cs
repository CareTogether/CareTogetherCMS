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
                        ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty
                    ),

                    V1ReferralFamilyUpdated updated => referral! with
                    {
                        FamilyId = updated.FamilyId
                    },

                    V1ReferralDetailsUpdated updated => referral! with
                    {
                        FamilyId = updated.FamilyId,
                        Title = updated.Title,
                        Comment = updated.Comment,
                        CreatedAtUtc = updated.CreatedAtUtc
                    },

                    V1ReferralClosed closed => referral! with
                    {
                        Status = V1ReferralStatus.Closed,
                        ClosedAtUtc = closed.ClosedAtUtc,
                        CloseReason = closed.CloseReason
                    },

                    V1ReferralReopened => referral! with
                    {
                        Status = V1ReferralStatus.Open,
                        ClosedAtUtc = null,
                        CloseReason = null
                    },

                    V1ReferralCustomFieldUpdated cf => referral! with
                    {
                        CompletedCustomFields =
                            referral!.CompletedCustomFields.SetItem(
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

            return referral!;
        }
    }
}
