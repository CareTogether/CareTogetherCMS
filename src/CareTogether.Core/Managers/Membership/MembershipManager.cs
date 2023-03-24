using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Membership
{
    public sealed class MembershipManager : IMembershipManager
    {
        private readonly IAccountsResource accountsResource;
        private readonly IAuthorizationEngine authorizationEngine;


        public MembershipManager(IAccountsResource accountsResource,
            IAuthorizationEngine authorizationEngine)
        {
            this.accountsResource = accountsResource;
            this.authorizationEngine = authorizationEngine;
        }


        public async Task<UserAccess> GetUserAccessAsync(ClaimsPrincipal user)
        {
            var account = await accountsResource.GetUserAccountAsync(user.UserId());

            var organizationsAccess = await Task.WhenAll(account.Organizations.Select(async organization =>
            {
                var organizationId = organization.OrganizationId;
                
                var locationsAccess = await Task.WhenAll(organization.Locations
                    .Select(async location =>
                    {
                        var locationId = location.LocationId;

                        var globalContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                            organizationId, locationId, user, new GlobalAuthorizationContext());
                        var allVolunteerFamiliesContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                            organizationId, locationId, user, new AllVolunteerFamiliesAuthorizationContext());
                        var allPartneringFamiliesContextPermissions = await authorizationEngine.AuthorizeUserAccessAsync(
                            organizationId, locationId, user, new AllPartneringFamiliesAuthorizationContext());

                        return new UserLocationAccess(locationId, location.PersonId, location.Roles,
                            globalContextPermissions,
                            allVolunteerFamiliesContextPermissions,
                            allPartneringFamiliesContextPermissions);
                    }));

                return new UserOrganizationAccess(organizationId, locationsAccess.ToImmutableList());
            }));

            return new UserAccess(user.UserId(), organizationsAccess.ToImmutableList());
        }
    }
}
