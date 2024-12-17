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
        readonly IAccountsResource _AccountsResource;
        readonly IAuthorizationEngine _AuthorizationEngine;
        readonly CombinedFamilyInfoFormatter _CombinedFamilyInfoFormatter;
        readonly IDirectoryResource _DirectoryResource;
        readonly IIdentityProvider _IdentityProvider;
        readonly IPoliciesResource _PoliciesResource;

        public MembershipManager(
            IAccountsResource accountsResource,
            IAuthorizationEngine authorizationEngine,
            IDirectoryResource directoryResource,
            IPoliciesResource policiesResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter,
            IIdentityProvider identityProvider
        )
        {
            _AccountsResource = accountsResource;
            _AuthorizationEngine = authorizationEngine;
            _DirectoryResource = directoryResource;
            _PoliciesResource = policiesResource;
            _CombinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
            _IdentityProvider = identityProvider;
        }

        public async Task<UserAccess> GetUserAccessAsync(ClaimsPrincipal user)
        {
            Account? account = await _AccountsResource.TryGetUserAccountAsync(user.UserId());
            if (account == null)
            {
                return new UserAccess(user.UserId(), ImmutableList<UserOrganizationAccess>.Empty);
            }

            UserOrganizationAccess[] organizationsAccess = await Task.WhenAll(
                account.Organizations.Select(async organization =>
                {
                    Guid organizationId = organization.OrganizationId;

                    UserLocationAccess[] locationsAccess = await Task.WhenAll(
                        organization.Locations.Select(async location =>
                        {
                            Guid locationId = location.LocationId;

                            ImmutableList<Permission> globalContextPermissions =
                                await _AuthorizationEngine.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    user,
                                    new GlobalAuthorizationContext()
                                );
                            ImmutableList<Permission> allVolunteerFamiliesContextPermissions =
                                await _AuthorizationEngine.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    user,
                                    new AllVolunteerFamiliesAuthorizationContext()
                                );
                            ImmutableList<Permission> allPartneringFamiliesContextPermissions =
                                await _AuthorizationEngine.AuthorizeUserAccessAsync(
                                    organizationId,
                                    locationId,
                                    user,
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

                    return new UserOrganizationAccess(organizationId, locationsAccess.ToImmutableList());
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
            Account? personUserAccount = await _AccountsResource.TryGetPersonUserAccountAsync(
                organizationId,
                locationId,
                personId
            );

            // Look up the target user's family.
            Family? targetUserFamily = await _DirectoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                personId
            );

            if (personUserAccount == null || targetUserFamily == null)
            {
                throw new InvalidOperationException("The target user does not exist in the current user's location.");
            }

            // Confirm that the current user has access to view the target user's login information.

            FamilyAuthorizationContext targetUserFamilyContext = new(targetUserFamily.Id);
            ImmutableList<Permission> globalContextPermissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                targetUserFamilyContext
            );
            if (!globalContextPermissions.Contains(Permission.ViewPersonUserLoginInfo))
            {
                throw new InvalidOperationException(
                    "The user is not authorized to access this user's login information."
                );
            }

            UserLoginInfo userLoginInfo = await _IdentityProvider.GetUserLoginInfoAsync(personUserAccount.UserId);

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
            ChangePersonRoles command = new(personId, roles);

            if (
                !await _AuthorizationEngine.AuthorizePersonAccessCommandAsync(organizationId, locationId, user, command)
            )
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            Family? personFamily = await _DirectoryResource.FindPersonFamilyAsync(organizationId, locationId, personId);

            //NOTE: This invariant could be revisited, but that would split 'Person' and 'Family' into separate aggregates.
            if (personFamily == null)
            {
                throw new InvalidOperationException(
                    "CareTogether currently assumes that all people should (always) belong to a family record."
                );
            }

            PersonAccessEntry result = await _AccountsResource.ExecutePersonAccessCommandAsync(
                organizationId,
                locationId,
                command,
                user.UserId()
            );

            CombinedFamilyInfo? familyResult = await _CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationId,
                personFamily.Id,
                user
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
            if (!await _AuthorizationEngine.AuthorizeGenerateUserInviteNonceAsync(organizationId, locationId, user))
            {
                throw new InvalidOperationException("The user is not authorized to perform this action.");
            }

            byte[] result = await _AccountsResource.GenerateUserInviteNonceAsync(
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
            {
                throw new InvalidOperationException(
                    "The user is already linked to a person in this organization and location."
                );
            }

            AccountLocationAccess? locationAccess = await _AccountsResource.TryLookupUserInviteNoncePersonIdAsync(
                organizationId,
                locationId,
                nonce
            );

            if (locationAccess == null)
            {
                return null;
            }

            Family? family = await _DirectoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                locationAccess.PersonId
            );
            if (family == null)
            {
                return null;
            }

            Person person = family.Adults.Single(adult => adult.Item1.Id == locationAccess.PersonId).Item1;

            OrganizationConfiguration configuration = await _PoliciesResource.GetConfigurationAsync(organizationId);

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
            Account? result = await _AccountsResource.TryRedeemUserInviteNonceAsync(
                organizationId,
                locationId,
                user.UserId(),
                nonce
            );

            return result;
        }
    }
}
