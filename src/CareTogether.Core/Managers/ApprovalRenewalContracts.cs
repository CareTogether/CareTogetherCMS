using System;
using System.Collections.Immutable;
using JsonPolymorph;

namespace CareTogether.Managers
{
    public sealed record DisclosedApprovalRenewalCandidate(
        string CandidateKey,
        ApprovalRenewalTarget Target,
        string ActionName,
        DateOnly FirstUncoveredOnUtc,
        DisclosedApprovalRenewalState State,
        ImmutableList<DisclosedApprovalRenewalRole> AffectedRoles
    );

    [JsonHierarchyBase]
    public abstract partial record ApprovalRenewalTarget;

    public sealed record FamilyApprovalRenewalTarget(Guid FamilyId) : ApprovalRenewalTarget;

    public sealed record IndividualApprovalRenewalTarget(Guid FamilyId, Guid PersonId)
        : ApprovalRenewalTarget;

    public sealed record OrganizationApprovalRenewalTarget(Guid CommunityId) : ApprovalRenewalTarget;

    public enum DisclosedApprovalRenewalState
    {
        Upcoming,
        Uncovered,
    }

    public sealed record DisclosedApprovalRenewalRole(ApprovalRenewalRoleScope Scope, string RoleName);

    public enum ApprovalRenewalRoleScope
    {
        Family,
        Individual,
        Organization,
    }
}
