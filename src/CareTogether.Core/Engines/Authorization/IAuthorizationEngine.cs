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
using CareTogether.Resources.V1Referrals;
using JsonPolymorph;

namespace CareTogether.Engines.Authorization
{
    [JsonHierarchyBase]
    public abstract partial record AuthorizationContext();

    public sealed record GlobalAuthorizationContext() : AuthorizationContext;

    public sealed record AllPartneringFamiliesAuthorizationContext() : AuthorizationContext;

    public sealed record AllVolunteerFamiliesAuthorizationContext() : AuthorizationContext;

    public sealed record FamilyAuthorizationContext(Guid FamilyId, Family? Family = null)
        : AuthorizationContext;

    public sealed record CommunityAuthorizationContext(Guid CommunityId) : AuthorizationContext;

    public sealed record SessionUserContext(ClaimsPrincipal User, Family? UserFamily);

    public interface IAuthorizationEngine
    {
        Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            FamilyCommand command
        );

        Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            Guid familyId,
            PersonCommand command
        );

        Task<bool> AuthorizeV1CaseCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            V1CaseCommand command
        );

        Task<bool> AuthorizeV1ReferralCommandAsync(
    Guid organizationId,
    Guid locationId,
    SessionUserContext user,
    V1ReferralCommand command
);

Task<bool> AuthorizeV1ReferralReadAsync(
    Guid organizationId,
    Guid locationId,
    SessionUserContext userContext
);


        Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            ArrangementsCommand command
        );

        Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            NoteCommand command
        );

        Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user
        );

        Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            VolunteerFamilyCommand command
        );

        Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            VolunteerCommand command
        );

        Task<bool> AuthorizeCommunityCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            CommunityCommand command
        );

        Task<bool> AuthorizePersonAccessCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user,
            PersonAccessCommand command
        );

        Task<bool> AuthorizeGenerateUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext user
        );

        Task<CombinedFamilyInfo> DiscloseFamilyAsync(
            SessionUserContext user,
            Guid organizationId,
            Guid locationId,
            CombinedFamilyInfo family
        );

        Task<CommunityInfo> DiscloseCommunityAsync(
            SessionUserContext user,
            Guid organizationId,
            Guid locationId,
            CommunityInfo community
        );
    }
}
