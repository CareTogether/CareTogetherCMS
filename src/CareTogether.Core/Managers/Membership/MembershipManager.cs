using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.Identity;

namespace CareTogether.Managers.Membership
{
    public sealed class MembershipManager : IMembershipManager
    {
        private readonly IAccountsResource accountsResource;
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IUserAccessCalculation userAccessCalculation;
        private readonly IDirectoryResource directoryResource;
        private readonly IPoliciesResource policiesResource;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;
        private readonly IIdentityProvider identityProvider;

        public MembershipManager(
            IAccountsResource accountsResource,
            IAuthorizationEngine authorizationEngine,
            IUserAccessCalculation userAccessCalculation,
            IDirectoryResource directoryResource,
            IPoliciesResource policiesResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter,
            IIdentityProvider identityProvider
        )
        {
            this.accountsResource = accountsResource;
            this.authorizationEngine = authorizationEngine;
            this.userAccessCalculation = userAccessCalculation;
            this.directoryResource = directoryResource;
            this.policiesResource = policiesResource;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
            this.identityProvider = identityProvider;
        }

        private async Task<SessionUserContext> CreateSessionUserContext(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        )
        {
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily =
                userPersonId == null
                    ? null
                    : await directoryResource.FindPersonFamilyAsync(
                        organizationId,
                        locationId,
                        userPersonId.Value
                    );
            var userContext = new SessionUserContext(user, userFamily);
            return userContext;
        }

        public async Task<UserAccess> GetUserAccessAsync(ClaimsPrincipal user)
        {
            var account = await accountsResource.TryGetUserAccountAsync(user.UserId());
            if (account == null)
                return new UserAccess(user.UserId(), ImmutableList<UserOrganizationAccess>.Empty);

            var organizationsAccess = await Task.WhenAll(
                account.Organizations.Select(async organization =>
                {
                    var organizationId = organization.OrganizationId;

                    var locationsAccess = await Task.WhenAll(
                        organization.Locations.Select(async location =>
                        {
                            var locationId = location.LocationId;

                            var userContext = await CreateSessionUserContext(
                                user,
                                organizationId,
                                locationId
                            );

                            var globalContextPermissions =
                                await userAccessCalculation.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    userContext,
                                    new GlobalAuthorizationContext()
                                );
                            var allVolunteerFamiliesContextPermissions =
                                await userAccessCalculation.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    userContext,
                                    new AllVolunteerFamiliesAuthorizationContext()
                                );
                            var allPartneringFamiliesContextPermissions =
                                await userAccessCalculation.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    userContext,
                                    new AllPartneringFamiliesAuthorizationContext()
                                );

                            return new UserLocationAccess(
                                locationId,
                                location.PersonId,
                                location.Roles,
                                globalContextPermissions,
                                allVolunteerFamiliesContextPermissions,
                                allPartneringFamiliesContextPermissions
                            );
                        })
                    );

                    return new UserOrganizationAccess(
                        organizationId,
                        locationsAccess.ToImmutableList()
                    );
                })
            );

            return new UserAccess(user.UserId(), organizationsAccess.ToImmutableList());
        }

        public async Task<UserLoginInfo> GetPersonLoginInfo(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            Guid personId
        )
        {
            // Confirm that the target user exists in the current user's location.
            var personUserAccount = await accountsResource.TryGetPersonUserAccountAsync(
                organizationId,
                locationId,
                personId
            );

            // Look up the target user's family.
            var targetUserFamily = await directoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                personId
            );

            if (personUserAccount == null || targetUserFamily == null)
                throw new InvalidOperationException(
                    "The target user does not exist in the current user's location."
                );

            // Confirm that the current user has access to view the target user's login information.

            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var targetUserFamilyContext = new FamilyAuthorizationContext(targetUserFamily.Id, null);
            var globalContextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                targetUserFamilyContext
            );
            if (!globalContextPermissions.Contains(Permission.ViewPersonUserLoginInfo))
                throw new InvalidOperationException(
                    "The user is not authorized to access this user's login information."
                );

            var userLoginInfo = await identityProvider.GetUserLoginInfoAsync(
                personUserAccount.UserId
            );

            return userLoginInfo;
        }

        public async Task<FamilyRecordsAggregate> ChangePersonRolesAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            Guid personId,
            ImmutableList<string> roles
        )
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );

            var command = new ChangePersonRoles(personId, roles);

            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            if (
                !await authorizationEngine.AuthorizePersonAccessCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    command
                )
            )
                throw new Exception("The user is not authorized to perform this command.");

            var personFamily = await directoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                personId
            );

            //NOTE: This invariant could be revisited, but that would split 'Person' and 'Family' into separate aggregates.
            if (personFamily == null)
                throw new Exception(
                    "CareTogether currently assumes that all people should (always) belong to a family record."
                );

            await accountsResource.ExecutePersonAccessCommandAsync(
                organizationId,
                locationId,
                command,
                user.UserId()
            );

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationPolicy,
                locationId,
                personFamily.Id,
                personFamily,
                userContext
            );

            return new FamilyRecordsAggregate(familyResult!);
        }

        public async Task<byte[]> GenerateUserInviteNonceAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            Guid personId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            if (
                !await authorizationEngine.AuthorizeGenerateUserInviteNonceAsync(
                    organizationId,
                    locationId,
                    userContext
                )
            )
                throw new Exception("The user is not authorized to perform this action.");

            var result = await accountsResource.GenerateUserInviteNonceAsync(
                organizationId,
                locationId,
                personId,
                user.UserId()
            );

            return result;
        }

        public async Task<UserInviteReviewInfo?> TryReviewUserInviteNonceAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            byte[] nonce
        )
        {
            if (user.PersonId(organizationId, locationId) != null)
                throw new Exception(
                    "The user is already linked to a person in this organization and location."
                );

            var locationAccess = await accountsResource.TryLookupUserInviteNoncePersonIdAsync(
                organizationId,
                locationId,
                nonce
            );

            if (locationAccess == null)
                return null;

            var family = await directoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                locationAccess.PersonId
            );
            if (family == null)
                return null;

            var person = family
                .Adults.Single(adult => adult.Item1.Id == locationAccess.PersonId)
                .Item1;

            var configuration = await policiesResource.GetConfigurationAsync(organizationId);

            return new UserInviteReviewInfo(
                organizationId,
                configuration.OrganizationName,
                locationId,
                configuration.Locations.Single(loc => loc.Id == locationId).Name,
                locationAccess.PersonId,
                person.FirstName,
                person.LastName,
                locationAccess.Roles
            );
        }

        public async Task<Account?> TryRedeemUserInviteNonceAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            byte[] nonce
        )
        {
            var result = await accountsResource.TryRedeemUserInviteNonceAsync(
                organizationId,
                locationId,
                user.UserId(),
                nonce
            );

            return result;
        }
    }
}
