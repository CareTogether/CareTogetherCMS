using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;

namespace CareTogether.Engines.Authorization
{
    public sealed class UserAccessCalculation : IUserAccessCalculation
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryResource directoryResource;
        private readonly IReferralsResource referralsResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly ICommunitiesResource communitiesResource;

        public UserAccessCalculation(
            IPoliciesResource policiesResource,
            IDirectoryResource directoryResource,
            IReferralsResource referralsResource,
            IApprovalsResource approvalsResource,
            ICommunitiesResource communitiesResource
        )
        {
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.referralsResource = referralsResource;
            this.approvalsResource = approvalsResource;
            this.communitiesResource = communitiesResource;
        }

        public async Task<ImmutableList<Permission>> AuthorizeUserAccessAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AuthorizationContext context
        )
        {
            // If the caller is using an API key, give full access.
            if (
                user.Identity?.AuthenticationType == "API Key"
                && (
                    user.HasClaim(Claims.OrganizationId, organizationId.ToString())
                    || user.HasClaim(Claims.Global, true.ToString())
                )
            )
                return Enum.GetValues<Permission>().ToImmutableList();

            // The user must have access to this organization and location.
            var userLocalIdentity = user.LocationIdentity(organizationId, locationId);
            if (userLocalIdentity == null)
                return ImmutableList<Permission>.Empty;

            // Look up the user's family, which will be referenced several times.
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily =
                userPersonId == null
                    ? null
                    : await directoryResource.FindPersonFamilyAsync(
                        organizationId,
                        locationId,
                        userPersonId.Value
                    );

            // If in a family authorization context, look up the target family, which will be referenced several times.
            var familyId = (context as FamilyAuthorizationContext)?.FamilyId;
            var targetFamily = familyId.HasValue
                ? await directoryResource.FindFamilyAsync(
                    organizationId,
                    locationId,
                    familyId.Value
                )
                : null;

            // Look up the target family's volunteer info to determine if they are a volunteer family.
            var targetFamilyIsVolunteerFamily =
                familyId.HasValue
                && await approvalsResource.TryGetVolunteerFamilyAsync(
                    organizationId,
                    locationId,
                    familyId.Value
                ) != null;

            // Look up the referrals info for both the user's family and the target family.
            //TODO: This could be optimized to find only the user family's referrals or the target family's referrals.
            var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);
            var userFamilyReferrals = referrals
                .Where(referral => referral.FamilyId == userFamily?.Id)
                .ToImmutableList();
            var targetFamilyReferrals = referrals
                .Where(referral => referral.FamilyId == targetFamily?.Id)
                .ToImmutableList();
            var assignedReferrals = referrals
                .Where(referral =>
                    referral.Arrangements.Any(arrangement =>
                        arrangement.Value.FamilyVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == userFamily?.Id
                        )
                        || arrangement.Value.IndividualVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == userFamily?.Id
                        )
                    )
                )
                .ToImmutableList();

            var targetFamilyAssignments = referrals
                .Where(referral =>
                    referral.Arrangements.Any(arrangement =>
                        arrangement.Value.FamilyVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == targetFamily?.Id
                        )
                        || arrangement.Value.IndividualVolunteerAssignments.Exists(assignment =>
                            assignment.FamilyId == targetFamily?.Id
                        )
                    )
                )
                .ToImmutableList();

            // Look up the user's family's and target family's community memberships
            var communities = await communitiesResource.ListLocationCommunitiesAsync(
                organizationId,
                locationId
            );
            var userFamilyCommunities =
                userFamily != null
                    ? communities
                        .Where(community => community.MemberFamilies.Contains(userFamily.Id))
                        .Select(community => community.Id)
                        .ToImmutableList()
                    : ImmutableList<Guid>.Empty;
            var targetFamilyCommunities =
                targetFamily != null
                    ? communities
                        .Where(community => community.MemberFamilies.Contains(targetFamily.Id))
                        .Select(community => community.Id)
                        .ToImmutableList()
                    : ImmutableList<Guid>.Empty;
            var userCommunityRoleAssignments = communities
                .SelectMany(community =>
                    community
                        .CommunityRoleAssignments.Where(assignment =>
                            assignment.PersonId == userPersonId
                        )
                        .Select(assignment => (community.Id, assignment.CommunityRole))
                )
                .ToImmutableList();

            // We need to evaluate each of the user's roles to determine which permission sets
            // apply to the user's current context.
            var config = await policiesResource.GetConfigurationAsync(organizationId);
            var userPermissionSets = config
                .Roles.Where(role =>
                    userLocalIdentity.HasClaim(userLocalIdentity.RoleClaimType, role.RoleName)
                )
                .SelectMany(role => role.PermissionSets)
                .ToImmutableList();
            var applicablePermissionSets = userPermissionSets
                .Where(permissionSet =>
                    IsPermissionSetApplicable(
                        permissionSet,
                        context,
                        userFamily,
                        targetFamily,
                        targetFamilyIsVolunteerFamily,
                        userFamilyReferrals,
                        targetFamilyReferrals,
                        assignedReferrals,
                        targetFamilyAssignments,
                        userFamilyCommunities,
                        targetFamilyCommunities,
                        userCommunityRoleAssignments,
                        communities
                    )
                )
                .ToImmutableList();

            return applicablePermissionSets
                .SelectMany(permissionSet => permissionSet.Permissions)
                .Distinct()
                .ToImmutableList();
        }

        internal static bool IsPermissionSetApplicable(
            ContextualPermissionSet permissionSet,
            AuthorizationContext context,
            Family? userFamily,
            Family? targetFamily,
            bool targetFamilyIsVolunteerFamily,
            ImmutableList<Resources.Referrals.ReferralEntry> userFamilyReferrals,
            ImmutableList<Resources.Referrals.ReferralEntry> targetFamilyReferrals,
            ImmutableList<Resources.Referrals.ReferralEntry> assignedReferrals,
            ImmutableList<Resources.Referrals.ReferralEntry> targetFamilyAssignedReferrals,
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
                        && !targetFamilyReferrals.IsEmpty,
                    _ => false,
                },
                //TODO: Should the following be restricted so only the assigned individual, or in the case of a family assignment,
                //      only the participating individuals, can access the partnering family?
                AssignedFunctionsInReferralPartneringFamilyPermissionContext c => context
                    is FamilyAuthorizationContext
                    && targetFamily != null
                    && targetFamilyReferrals.Any(referral => //TODO: The individual logic blocks here can be extracted to helper methods.
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)
                        )
                        && referral.Arrangements.Any(arrangement =>
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
                    && userFamilyReferrals.Any(referral =>
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)
                        )
                        && referral.Arrangements.Any(arrangement =>
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
                    && assignedReferrals.Any(referral =>
                        (
                            c.WhenReferralIsOpen == null
                            || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)
                        )
                        && referral.Arrangements.Any(arrangement =>
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
                        && referral.Arrangements.Any(arrangement =>
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
                        && targetFamilyReferrals.Any(referral =>
                            referral.Arrangements.Any(arrangement =>
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
                        && targetFamilyAssignedReferrals
                            .SelectMany(referral =>
                                referral.Arrangements.Select(arrangement =>
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
