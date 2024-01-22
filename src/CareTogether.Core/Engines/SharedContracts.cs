using System;
using Timelines;

namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus,
        DateTime? ExpiresAt);

    //TODO: A much cleaner approach would be a DateOnlyTimeline<T>, where each range has a tag.
    public sealed record ApprovalTimelines(
        DateOnlyTimeline? Onboarded,
        DateOnlyTimeline? Approved,
        DateOnlyTimeline? Expired,
        DateOnlyTimeline? Prospective)
    {
        public RoleApprovalStatus? StatusAt(DateOnly date)
        {
            // If the user is onboarded on the date in question, they are onboarded.
            // If they are not onboarded but are approved, they are approved.
            // If they are not approved *but were ever approved*, they are expired.
            // NOTE: We assume that onboarding-stage requirements never expire.
            // If they are prospective on the date in question, they are prospective.
            // Otherwise, they have no status on the date in question.
            if (Onboarded != null && Onboarded.Contains(date))
                return RoleApprovalStatus.Onboarded;
            else if (Approved != null && Approved.Contains(date))
                return RoleApprovalStatus.Approved;
            else if (Approved != null && !Approved.Contains(date))
                return RoleApprovalStatus.Expired;
            else if (Prospective != null && Prospective.Contains(date))
                return RoleApprovalStatus.Prospective;
            return null;
        }
    }

    public enum RoleApprovalStatus { Prospective = 0, Expired = 1, Approved = 2, Onboarded = 3 };
}
