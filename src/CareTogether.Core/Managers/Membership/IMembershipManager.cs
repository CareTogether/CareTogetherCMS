using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Managers.Records;
using CareTogether.Resources.Accounts;

namespace CareTogether.Managers.Membership
{
    public sealed record UserAccess(Guid UserId,
        ImmutableList<UserOrganizationAccess> Organizations);
    public sealed record UserOrganizationAccess(Guid OrganizationId,
        ImmutableList<UserLocationAccess> Locations);
    public sealed record UserLocationAccess(Guid LocationId,
        Guid PersonId, ImmutableList<string> Roles,
        ImmutableList<Permission> GlobalContextPermissions,
        ImmutableList<Permission> AllVolunteerFamiliesContextPermissions,
        ImmutableList<Permission> AllPartneringFamiliesContextPermissions);
    
    public sealed record UserInviteReviewInfo(
        Guid OrganizationId, string OrganizationName,
        Guid LocationId, string LocationName,
        Guid PersonId, string FirstName, string LastName,
        ImmutableList<string> Roles);

    public interface IMembershipManager
    {
        Task<UserAccess> GetUserAccessAsync(ClaimsPrincipal user);
        
        Task<FamilyRecordsAggregate> ChangePersonRolesAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId,
            Guid personId, ImmutableList<string> roles);

        Task<byte[]> GenerateUserInviteNonceAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId,
            Guid personId);
        
        Task<UserInviteReviewInfo?> TryReviewUserInviteNonceAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId,
            byte[] nonce);

        Task<Account?> TryRedeemUserInviteNonceAsync(ClaimsPrincipal user, Guid organizationId, Guid locationId,
            byte[] nonce);
    }
}
