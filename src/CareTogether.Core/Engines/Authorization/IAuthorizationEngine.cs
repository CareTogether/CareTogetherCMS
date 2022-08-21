using CareTogether.Managers;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines.Authorization
{
    public interface IAuthorizationEngine
    {
        Task<ImmutableList<Permission>> AuthorizeFamilyAccessAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, Guid familyId);

        Task<bool> AuthorizeFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, FamilyCommand command);

        Task<bool> AuthorizePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command);

        Task<bool> AuthorizeReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<bool> AuthorizeArrangementsCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementsCommand command);

        Task<bool> AuthorizeNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, NoteCommand command);

        Task<bool> AuthorizeSendSmsAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user);

        Task<bool> AuthorizeVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<bool> AuthorizeVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);

        Task<PartneringFamilyInfo> DisclosePartneringFamilyInfoAsync(ClaimsPrincipal user,
            PartneringFamilyInfo partneringFamilyInfo, Guid organizationId, Guid locationId);

        Task<VolunteerFamilyInfo> DiscloseVolunteerFamilyInfoAsync(ClaimsPrincipal user,
            VolunteerFamilyInfo volunteerFamilyInfo, Guid organizationId, Guid locationId);

        Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user,
            Family family, Guid organizationId, Guid locationId);

        Task<bool> DiscloseNoteAsync(ClaimsPrincipal user,
            Guid familyId, Note note, Guid organizationId, Guid locationId);
    }
}
