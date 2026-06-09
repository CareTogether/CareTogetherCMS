using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1Referrals;

namespace CareTogether.Engines.Authorization
{
    public sealed class UserAccessCalculation : IUserAccessCalculation
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryResource directoryResource;
        private readonly IV1CasesResource v1CasesResource;
        private readonly IV1ReferralsResource v1ReferralsResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly ICommunitiesResource communitiesResource;

        public UserAccessCalculation(
            IPoliciesResource policiesResource,
            IDirectoryResource directoryResource,
            IV1CasesResource v1CasesResource,
            IV1ReferralsResource v1ReferralsResource,
            IApprovalsResource approvalsResource,
            ICommunitiesResource communitiesResource
        )
        {
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.v1CasesResource = v1CasesResource;
            this.v1ReferralsResource = v1ReferralsResource;
            this.approvalsResource = approvalsResource;
            this.communitiesResource = communitiesResource;
        }

        public async Task<ImmutableList<Permission>> AuthorizeUserAccessAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            AuthorizationContext context
        )
        {
            if (HasApiKeyFullAccess(userContext, organizationId))
                return Enum.GetValues<Permission>().ToImmutableList();

            // The user must have access to this organization and location.
            var userLocalIdentity = userContext.User.LocationIdentity(organizationId, locationId);
            if (userLocalIdentity == null)
                return ImmutableList<Permission>.Empty;

            var familyContext =
                context is FamilyAuthorizationContext
                    ? context as FamilyAuthorizationContext
                    : null;

            var targetFamily =
                familyContext == null
                    ? null
                    : familyContext.Family
                        ?? await directoryResource.FindFamilyAsync(
                            organizationId,
                            locationId,
                            familyContext.FamilyId
                        );

            var targetV1Referral = context is V1ReferralAuthorizationContext referralContext
                ? await v1ReferralsResource.GetReferralAsync(
                    organizationId,
                    locationId,
                    referralContext.ReferralId
                )
                : null;

            // Look up the target family's volunteer info to determine if they are a volunteer family.
            var targetVolunteerFamily =
                familyContext == null
                    ? null
                    : await approvalsResource.TryGetVolunteerFamilyAsync(
                        organizationId,
                        locationId,
                        familyContext.FamilyId
                    );

            var snapshot = await CreateSnapshotAsync(
                organizationId,
                locationId,
                userContext,
                targetFamily == null ? null : [targetFamily],
                targetV1Referral == null ? null : [targetV1Referral],
                volunteerFamilyIds: targetVolunteerFamily == null
                    ? []
                    : [targetVolunteerFamily.FamilyId]
            );

            return AuthorizeUserAccess(snapshot, context);
        }

        public async Task<UserAccessCalculationSnapshot> CreateSnapshotAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            IEnumerable<Family>? families = null,
            IEnumerable<V1Referral>? referrals = null,
            IEnumerable<Community>? communities = null,
            IEnumerable<Guid>? volunteerFamilyIds = null
        )
        {
            var userPersonId = userContext.User.PersonId(organizationId, locationId);
            var userFamilyTask =
                userContext.UserFamily != null || userPersonId == null
                    ? Task.FromResult(userContext.UserFamily)
                    : directoryResource.FindPersonFamilyAsync(
                        organizationId,
                        locationId,
                        userPersonId.Value
                    );
            var communitiesTask =
                communities == null
                    ? communitiesResource.ListLocationCommunitiesAsync(organizationId, locationId)
                    : Task.FromResult(communities.ToImmutableList());
            var volunteerFamilyIdsTask =
                volunteerFamilyIds == null
                    ? ListVolunteerFamilyIdsAsync(organizationId, locationId)
                    : Task.FromResult(volunteerFamilyIds.ToArray());
            var configTask = policiesResource.GetConfigurationAsync(organizationId);

            var userFamily = await userFamilyTask;
            var locationCommunities = (await communitiesTask).ToImmutableList();
            var knownVolunteerFamilyIds = (await volunteerFamilyIdsTask).ToImmutableHashSet();
            var config = await configTask;
            var userLocalIdentity = userContext.User.LocationIdentity(organizationId, locationId);
            var userPermissionSets =
                userLocalIdentity == null
                    ? ImmutableList<ContextualPermissionSet>.Empty
                    : config
                        .Roles.Where(role =>
                            userLocalIdentity.HasClaim(
                                userLocalIdentity.RoleClaimType,
                                role.RoleName
                            )
                        )
                        .SelectMany(role => role.PermissionSets)
                        .ToImmutableList();
            var familiesById = BuildFamiliesById(families, userFamily);
            var v1CaseIndexes = await LoadV1CaseIndexesAsync(
                organizationId,
                locationId,
                volunteerFamilyIds == null,
                familiesById.Keys,
                knownVolunteerFamilyIds.Union(familiesById.Keys)
            );

            return new UserAccessCalculationSnapshot(
                organizationId,
                locationId,
                userContext,
                userPersonId,
                userFamily,
                familiesById,
                v1CaseIndexes.V1CasesByFamilyId,
                v1CaseIndexes.V1CasesAssignedToVolunteerFamilyId,
                (referrals ?? []).ToImmutableDictionary(
                    referral => referral.ReferralId,
                    referral => referral
                ),
                knownVolunteerFamilyIds,
                locationCommunities,
                BuildCommunityIdsByFamilyId(locationCommunities),
                BuildUserCommunityRoleAssignments(locationCommunities, userPersonId),
                userPermissionSets
            );
        }

        public ImmutableList<Permission> AuthorizeUserAccess(
            UserAccessCalculationSnapshot snapshot,
            AuthorizationContext context
        )
        {
            if (HasApiKeyFullAccess(snapshot.UserContext, snapshot.OrganizationId))
                return Enum.GetValues<Permission>().ToImmutableList();

            var userLocalIdentity = snapshot.UserContext.User.LocationIdentity(
                snapshot.OrganizationId,
                snapshot.LocationId
            );
            if (userLocalIdentity == null)
                return ImmutableList<Permission>.Empty;

            var familyAuthorizationContext = context as FamilyAuthorizationContext;
            var familyId = familyAuthorizationContext?.FamilyId;
            var targetFamily =
                familyAuthorizationContext?.Family
                ?? (
                    familyId.HasValue
                    && snapshot.FamiliesById.TryGetValue(familyId.Value, out var family)
                        ? family
                        : null
                );
            var targetFamilyIsVolunteerFamily =
                familyId.HasValue && snapshot.VolunteerFamilyIds.Contains(familyId.Value);
            var userFamilyV1Cases =
                snapshot.UserFamily == null
                    ? ImmutableList<Resources.V1Cases.V1CaseEntry>.Empty
                    : snapshot.V1CasesByFamilyId.GetValueOrEmptyList(snapshot.UserFamily.Id);
            var targetFamilyV1Cases =
                targetFamily == null
                    ? ImmutableList<Resources.V1Cases.V1CaseEntry>.Empty
                    : snapshot.V1CasesByFamilyId.GetValueOrEmptyList(targetFamily.Id);
            var targetV1Referral =
                context is V1ReferralAuthorizationContext referralContext
                && snapshot.V1ReferralsById.TryGetValue(
                    referralContext.ReferralId,
                    out var referral
                )
                    ? referral
                    : null;
            var assignedV1Cases =
                snapshot.UserFamily == null
                    ? ImmutableList<Resources.V1Cases.V1CaseEntry>.Empty
                    : snapshot.V1CasesAssignedToVolunteerFamilyId.GetValueOrEmptyList(
                        snapshot.UserFamily.Id
                    );
            var targetFamilyAssignments =
                targetFamily == null
                    ? ImmutableList<Resources.V1Cases.V1CaseEntry>.Empty
                    : snapshot.V1CasesAssignedToVolunteerFamilyId.GetValueOrEmptyList(
                        targetFamily.Id
                    );
            var userFamilyCommunities =
                snapshot.UserFamily == null
                    ? ImmutableList<Guid>.Empty
                    : snapshot.CommunityIdsByFamilyId.GetValueOrEmptyList(snapshot.UserFamily.Id);
            var targetFamilyCommunities =
                targetFamily == null
                    ? ImmutableList<Guid>.Empty
                    : snapshot.CommunityIdsByFamilyId.GetValueOrEmptyList(targetFamily.Id);
            var applicablePermissionSets = snapshot
                .UserPermissionSets.Where(permissionSet =>
                    IsPermissionSetApplicable(
                        permissionSet,
                        context,
                        snapshot.UserFamily,
                        targetFamily,
                        targetFamilyIsVolunteerFamily,
                        userFamilyV1Cases,
                        targetFamilyV1Cases,
                        assignedV1Cases,
                        targetFamilyAssignments,
                        targetV1Referral,
                        snapshot.UserPersonId,
                        userFamilyCommunities,
                        targetFamilyCommunities,
                        snapshot.UserCommunityRoleAssignments,
                        snapshot.Communities
                    )
                )
                .ToImmutableList();

            return applicablePermissionSets
                .SelectMany(permissionSet => permissionSet.Permissions)
                .Distinct()
                .ToImmutableList();
        }

        private static bool HasApiKeyFullAccess(SessionUserContext userContext, Guid organizationId)
        {
            if (userContext.User.Identity?.AuthenticationType != "API Key")
                return false;

            return userContext.User.HasClaim(Claims.OrganizationId, organizationId.ToString())
                || userContext.User.HasClaim(Claims.Global, true.ToString());
        }

        private static ImmutableDictionary<Guid, Family> BuildFamiliesById(
            IEnumerable<Family>? families,
            Family? userFamily
        )
        {
            var result = ImmutableDictionary<Guid, Family>.Empty;

            foreach (var family in families ?? [])
                result = result.SetItem(family.Id, family);

            return userFamily == null ? result : result.SetItem(userFamily.Id, userFamily);
        }

        private async Task<(
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.V1Cases.V1CaseEntry>
            > V1CasesByFamilyId,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.V1Cases.V1CaseEntry>
            > V1CasesAssignedToVolunteerFamilyId
        )> LoadV1CaseIndexesAsync(
            Guid organizationId,
            Guid locationId,
            bool loadAllV1Cases,
            IEnumerable<Guid> familyIds,
            IEnumerable<Guid> assignedVolunteerFamilyIds
        )
        {
            var familyIdSet = familyIds.ToImmutableHashSet();
            var assignedVolunteerFamilyIdSet = assignedVolunteerFamilyIds.ToImmutableHashSet();

            if (loadAllV1Cases)
            {
                var v1Cases = await v1CasesResource.ListV1CasessAsync(organizationId, locationId);
                return (
                    v1Cases
                        .GroupBy(v1Case => v1Case.FamilyId)
                        .ToImmutableDictionary(
                            group => group.Key,
                            group => group.ToImmutableList()
                        ),
                    BuildV1CasesAssignedToVolunteerFamilyId(v1Cases)
                );
            }

            var v1CasesByFamilyTasks = familyIdSet
                .Select(async familyId =>
                    (
                        familyId,
                        v1Cases: await v1CasesResource.ListV1CasesForFamilyAsync(
                            organizationId,
                            locationId,
                            familyId
                        )
                    )
                )
                .ToArray();
            var assignedV1CasesByVolunteerFamilyTasks = assignedVolunteerFamilyIdSet
                .Select(async volunteerFamilyId =>
                    (
                        volunteerFamilyId,
                        v1Cases: await v1CasesResource.ListV1CasesAssignedToVolunteerFamilyAsync(
                            organizationId,
                            locationId,
                            volunteerFamilyId
                        )
                    )
                )
                .ToArray();

            return (
                (await Task.WhenAll(v1CasesByFamilyTasks))
                    .Where(x => !x.v1Cases.IsEmpty)
                    .ToImmutableDictionary(x => x.familyId, x => x.v1Cases),
                (await Task.WhenAll(assignedV1CasesByVolunteerFamilyTasks))
                    .Where(x => !x.v1Cases.IsEmpty)
                    .ToImmutableDictionary(x => x.volunteerFamilyId, x => x.v1Cases)
            );
        }

        private async Task<Guid[]> ListVolunteerFamilyIdsAsync(Guid organizationId, Guid locationId)
        {
            var volunteerFamilies = await approvalsResource.ListVolunteerFamiliesAsync(
                organizationId,
                locationId
            );
            return volunteerFamilies.Select(volunteerFamily => volunteerFamily.FamilyId).ToArray();
        }

        private static ImmutableDictionary<
            Guid,
            ImmutableList<Resources.V1Cases.V1CaseEntry>
        > BuildV1CasesAssignedToVolunteerFamilyId(
            IEnumerable<Resources.V1Cases.V1CaseEntry> v1Cases
        )
        {
            var assignmentsByFamilyId = new Dictionary<Guid, List<Resources.V1Cases.V1CaseEntry>>();

            foreach (var v1Case in v1Cases)
            {
                var assignedFamilyIds = v1Case
                    .Arrangements.SelectMany(arrangement =>
                        arrangement
                            .Value.FamilyVolunteerAssignments.Select(assignment =>
                                assignment.FamilyId
                            )
                            .Concat(
                                arrangement.Value.IndividualVolunteerAssignments.Select(
                                    assignment => assignment.FamilyId
                                )
                            )
                    )
                    .ToHashSet();

                foreach (var assignedFamilyId in assignedFamilyIds)
                {
                    if (!assignmentsByFamilyId.TryGetValue(assignedFamilyId, out var assignedCases))
                    {
                        assignedCases = [];
                        assignmentsByFamilyId.Add(assignedFamilyId, assignedCases);
                    }

                    assignedCases.Add(v1Case);
                }
            }

            return assignmentsByFamilyId.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.ToImmutableList()
            );
        }

        private static ImmutableDictionary<Guid, ImmutableList<Guid>> BuildCommunityIdsByFamilyId(
            IEnumerable<Community> communities
        )
        {
            var communityIdsByFamilyId = new Dictionary<Guid, List<Guid>>();

            foreach (var community in communities)
            {
                foreach (var familyId in community.MemberFamilies)
                {
                    if (!communityIdsByFamilyId.TryGetValue(familyId, out var communityIds))
                    {
                        communityIds = [];
                        communityIdsByFamilyId.Add(familyId, communityIds);
                    }

                    communityIds.Add(community.Id);
                }
            }

            return communityIdsByFamilyId.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.ToImmutableList()
            );
        }

        private static ImmutableList<(
            Guid Id,
            string CommunityRole
        )> BuildUserCommunityRoleAssignments(IEnumerable<Community> communities, Guid? userPersonId)
        {
            if (userPersonId == null)
                return [];

            return communities
                .SelectMany(community =>
                    community
                        .CommunityRoleAssignments.Where(assignment =>
                            assignment.PersonId == userPersonId
                        )
                        .Select(assignment => (community.Id, assignment.CommunityRole))
                )
                .ToImmutableList();
        }

        internal static bool IsPermissionSetApplicable(
            ContextualPermissionSet permissionSet,
            AuthorizationContext context,
            Family? userFamily,
            Family? targetFamily,
            bool targetFamilyIsVolunteerFamily,
            ImmutableList<Resources.V1Cases.V1CaseEntry> userFamilyV1Cases,
            ImmutableList<Resources.V1Cases.V1CaseEntry> targetFamilyV1Cases,
            ImmutableList<Resources.V1Cases.V1CaseEntry> assignedV1Cases,
            ImmutableList<Resources.V1Cases.V1CaseEntry> targetFamilyAssignedV1Cases,
            Resources.V1Referrals.V1Referral? targetV1Referral,
            Guid? userPersonId,
            ImmutableList<Guid> userFamilyCommunities,
            ImmutableList<Guid> targetFamilyCommunities,
            ImmutableList<(Guid Id, string CommunityRole)> userCommunityRoleAssignments,
            ImmutableList<Community> communities
        )
        {
            return permissionSet.Context switch
            {
                GlobalPermissionContext c => true,
                OwnFamilyPermissionContext c => context is FamilyAuthorizationContext
                    && userFamily != null
                    && userFamily.Id == targetFamily?.Id,
                AllVolunteerFamiliesPermissionContext c => context switch
                {
                    AllVolunteerFamiliesAuthorizationContext => true,
                    FamilyAuthorizationContext => targetFamily != null
                        && targetFamilyIsVolunteerFamily,
                    _ => false,
                },
                AllPartneringFamiliesPermissionContext c => context switch
                {
                    AllPartneringFamiliesAuthorizationContext => true,
                    FamilyAuthorizationContext => targetFamily != null
                        && !targetFamilyV1Cases.IsEmpty,
                    _ => false,
                },
                //TODO: Should the following be restricted so only the assigned individual, or in the case of a family assignment,
                //      only the participating individuals, can access the partnering family?
                AssignedFunctionsInReferralPartneringFamilyPermissionContext c => context
                    is FamilyAuthorizationContext
                    && targetFamily != null
                    && targetFamilyV1Cases.Any(v1Case => //TODO: The individual logic blocks here can be extracted to helper methods.
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (v1Case.ClosedAtUtc == null)
                        )
                        && v1Case.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == userFamily?.Id
                                && (
                                    c.WhenOwnFunctionIsIn == null
                                    || c.WhenOwnFunctionIsIn.Contains(fva.ArrangementFunction)
                                )
                            )
                            || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == userFamily?.Id
                                && (
                                    c.WhenOwnFunctionIsIn == null
                                    || c.WhenOwnFunctionIsIn.Contains(iva.ArrangementFunction)
                                )
                            )
                        )
                    ),
                OwnReferralAssigneeFamiliesPermissionContext c => context
                    is FamilyAuthorizationContext
                    && targetFamily != null
                    && userFamilyV1Cases.Any(v1Case =>
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (v1Case.ClosedAtUtc == null)
                        )
                        && v1Case.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == targetFamily.Id
                                && (
                                    c.WhenAssigneeFunctionIsIn == null
                                    || c.WhenAssigneeFunctionIsIn.Contains(fva.ArrangementFunction)
                                )
                            )
                            || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == targetFamily.Id
                                && (
                                    c.WhenAssigneeFunctionIsIn == null
                                    || c.WhenAssigneeFunctionIsIn.Contains(iva.ArrangementFunction)
                                )
                            )
                        )
                    ),
                AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext c => context
                    is FamilyAuthorizationContext
                    && targetFamily != null
                    && assignedV1Cases.Any(v1Case =>
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (v1Case.ClosedAtUtc == null)
                        )
                        && v1Case.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == userFamily?.Id
                                && (
                                    c.WhenOwnFunctionIsIn == null
                                    || c.WhenOwnFunctionIsIn.Contains(fva.ArrangementFunction)
                                )
                            )
                            || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == userFamily?.Id
                                && (
                                    c.WhenOwnFunctionIsIn == null
                                    || c.WhenOwnFunctionIsIn.Contains(iva.ArrangementFunction)
                                )
                            )
                        )
                        && v1Case.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == targetFamily.Id
                                && (
                                    c.WhenAssigneeFunctionIsIn == null
                                    || c.WhenAssigneeFunctionIsIn.Contains(fva.ArrangementFunction)
                                )
                            )
                            || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == targetFamily.Id
                                && (
                                    c.WhenAssigneeFunctionIsIn == null
                                    || c.WhenAssigneeFunctionIsIn.Contains(iva.ArrangementFunction)
                                )
                            )
                        )
                    ),
                AssignedVolunteerInV1ReferralPermissionContext c => context
                    is V1ReferralAuthorizationContext
                    && targetV1Referral != null
                    && userPersonId.HasValue
                    && (
                        c.WhenReferralIsOpen == null
                        || c.WhenReferralIsOpen
                            == (targetV1Referral.Status == V1ReferralStatus.Open)
                    )
                    && targetV1Referral.AssignedIndividualVolunteers.Any(assignment =>
                        assignment.PersonId == userPersonId.Value
                        && (
                            c.WhenAssignmentRoleIsIn == null
                            || c.WhenAssignmentRoleIsIn.Contains(assignment.AssignmentRole)
                        )
                    ),
                AssignedVolunteerInV1CasePermissionContext c => context
                    is FamilyAuthorizationContext
                    && userPersonId.HasValue
                    && targetFamilyV1Cases.Any(v1Case =>
                        (
                            c.WhenCaseIsOpen == null
                            || c.WhenCaseIsOpen == (v1Case.ClosedAtUtc == null)
                        )
                        && v1Case.AssignedIndividualVolunteers.Any(assignment =>
                            assignment.PersonId == userPersonId.Value
                            && (
                                c.WhenAssignmentRoleIsIn == null
                                || c.WhenAssignmentRoleIsIn.Contains(assignment.AssignmentRole)
                            )
                        )
                    ),
                CommunityMemberPermissionContext c => context is CommunityAuthorizationContext auth
                    && userFamilyCommunities.Contains(auth.CommunityId)
                    && (
                        c.WhenOwnCommunityRoleIsIn == null
                        || c.WhenOwnCommunityRoleIsIn.Any(cr =>
                            userCommunityRoleAssignments.Any(cra =>
                                cra.Id == auth.CommunityId && cra.CommunityRole == cr
                            )
                        )
                    ),
                CommunityCoMemberFamiliesPermissionContext c => context
                    is FamilyAuthorizationContext
                    && userFamilyCommunities
                        .Intersect(targetFamilyCommunities)
                        .Any(community =>
                            c.WhenOwnCommunityRoleIsIn == null
                            || c.WhenOwnCommunityRoleIsIn.Any(cr =>
                                userCommunityRoleAssignments.Any(cra =>
                                    cra.Id == community && cra.CommunityRole == cr
                                )
                            )
                        ),
                CommunityCoMemberFamiliesAssignedFunctionsInReferralPartneringFamilyPermissionContext c =>
                    context is FamilyAuthorizationContext
                        && !userFamilyCommunities.IsEmpty
                        && targetFamily != null
                        && (
                            c.WhenOwnCommunityRoleIsIn == null
                            || c.WhenOwnCommunityRoleIsIn.Intersect(
                                    userCommunityRoleAssignments.Select(cra => cra.CommunityRole)
                                )
                                .Any()
                        )
                        && targetFamilyV1Cases.Any(v1Case =>
                            v1Case.Arrangements.Any(arrangement =>
                                arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                    (
                                        c.WhenOwnCommunityRoleIsIn == null
                                            ? userFamilyCommunities
                                            : userCommunityRoleAssignments
                                                .Where(cra =>
                                                    c.WhenOwnCommunityRoleIsIn.Contains(
                                                        cra.CommunityRole
                                                    )
                                                )
                                                .Select(cra => cra.Id)
                                    ).Any(communityId =>
                                        communities.Any(community =>
                                            community.Id == communityId
                                            && community.MemberFamilies.Contains(fva.FamilyId)
                                        )
                                    )
                                )
                                || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                    (
                                        c.WhenOwnCommunityRoleIsIn == null
                                            ? userFamilyCommunities
                                            : userCommunityRoleAssignments
                                                .Where(cra =>
                                                    c.WhenOwnCommunityRoleIsIn.Contains(
                                                        cra.CommunityRole
                                                    )
                                                )
                                                .Select(cra => cra.Id)
                                    ).Any(communityId =>
                                        communities.Any(community =>
                                            community.Id == communityId
                                            && community.MemberFamilies.Contains(iva.FamilyId)
                                        )
                                    )
                                )
                            )
                        ),
                CommunityCoMemberFamiliesAssignedFunctionsInReferralCoAssignedFamiliesPermissionContext c =>
                    context is FamilyAuthorizationContext
                        && !userFamilyCommunities.IsEmpty
                        && targetFamily != null
                        && targetFamilyAssignedV1Cases
                            .SelectMany(v1Case =>
                                v1Case.Arrangements.Select(arrangement =>
                                    arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                        (
                                            c.WhenOwnCommunityRoleIsIn == null
                                                ? userFamilyCommunities
                                                : userCommunityRoleAssignments
                                                    .Where(cra =>
                                                        c.WhenOwnCommunityRoleIsIn.Contains(
                                                            cra.CommunityRole
                                                        )
                                                    )
                                                    .Select(cra => cra.Id)
                                        ).Any(communityId =>
                                            communities.Any(community =>
                                                community.Id == communityId
                                                && community.MemberFamilies.Contains(fva.FamilyId)
                                            )
                                        )
                                    )
                                    || arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                        (
                                            c.WhenOwnCommunityRoleIsIn == null
                                                ? userFamilyCommunities
                                                : userCommunityRoleAssignments
                                                    .Where(cra =>
                                                        c.WhenOwnCommunityRoleIsIn.Contains(
                                                            cra.CommunityRole
                                                        )
                                                    )
                                                    .Select(cra => cra.Id)
                                        ).Any(communityId =>
                                            communities.Any(community =>
                                                community.Id == communityId
                                                && community.MemberFamilies.Contains(iva.FamilyId)
                                            )
                                        )
                                    )
                                )
                            )
                            .Any(),
                _ => throw new NotImplementedException(
                    $"The permission context type '{permissionSet.Context.GetType().FullName}' has not been implemented."
                ),
            };
        }
    }
}
