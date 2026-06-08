using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Referrals;

namespace CareTogether.Engines.Authorization
{
    public sealed record UserAccessCalculationSnapshot(
        Guid OrganizationId,
        Guid LocationId,
        SessionUserContext UserContext,
        Guid? UserPersonId,
        Family? UserFamily,
        ImmutableDictionary<Guid, Family> FamiliesById,
        ImmutableDictionary<Guid, ImmutableList<Resources.V1Cases.V1CaseEntry>> V1CasesByFamilyId,
        ImmutableDictionary<Guid, ImmutableList<Resources.V1Cases.V1CaseEntry>> V1CasesAssignedToVolunteerFamilyId,
        ImmutableDictionary<Guid, V1Referral> V1ReferralsById,
        ImmutableHashSet<Guid> VolunteerFamilyIds,
        ImmutableList<Community> Communities,
        ImmutableDictionary<Guid, ImmutableList<Guid>> CommunityIdsByFamilyId,
        ImmutableList<(Guid Id, string CommunityRole)> UserCommunityRoleAssignments,
        ImmutableList<ContextualPermissionSet> UserPermissionSets
    );

    public interface IUserAccessCalculation
    {
        Task<ImmutableList<Permission>> AuthorizeUserAccessAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            AuthorizationContext context
        );

        Task<UserAccessCalculationSnapshot> CreateSnapshotAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            IEnumerable<Family>? families = null,
            IEnumerable<V1Referral>? referrals = null,
            IEnumerable<Community>? communities = null,
            IEnumerable<Guid>? volunteerFamilyIds = null
        );

        ImmutableList<Permission> AuthorizeUserAccess(
            UserAccessCalculationSnapshot snapshot,
            AuthorizationContext context
        );
    }
}
