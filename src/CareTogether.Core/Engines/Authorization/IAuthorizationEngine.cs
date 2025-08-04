using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Managers;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.V1Cases;
using JsonPolymorph;

namespace CareTogether.Engines.Authorization
{
    [JsonHierarchyBase]
    public abstract partial record AuthorizationContext();

    public sealed record GlobalAuthorizationContext() : AuthorizationContext;

    public sealed record AllPartneringFamiliesAuthorizationContext() : AuthorizationContext;

    public sealed record AllVolunteerFamiliesAuthorizationContext() : AuthorizationContext;

    public sealed record FamilyAuthorizationContext(Guid FamilyId) : AuthorizationContext;

    public sealed record CommunityAuthorizationContext(Guid CommunityId) : AuthorizationContext;

    public interface IAuthorizationEngine
    {
        Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            FamilyCommand command
        );

        Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            PersonCommand command
        );

        Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            ReferralCommand command
        );

        Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            ArrangementsCommand command
        );

        Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            NoteCommand command
        );

        Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user
        );

        Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            VolunteerFamilyCommand command
        );

        Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            VolunteerCommand command
        );

        Task<bool> AuthorizeCommunityCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CommunityCommand command
        );

        Task<bool> AuthorizePersonAccessCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            PersonAccessCommand command
        );

        Task<bool> AuthorizeGenerateUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user
        );

        Task<CombinedFamilyInfo> DiscloseFamilyAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            CombinedFamilyInfo family
        );

        Task<CommunityInfo> DiscloseCommunityAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            CommunityInfo community
        );
    }
}
