using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines.Authorization
{
    public interface IAuthorizationEngine
    {
        Task<bool> AuthorizeFamilyAccessAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId);

        Task<bool> AuthorizeFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, FamilyCommand command);

        Task<bool> AuthorizePersonCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId, PersonCommand command);

        Task<bool> AuthorizeReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command);

        Task<bool> AuthorizeArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command);

        Task<bool> AuthorizeNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, NoteCommand command);

        Task<bool> AuthorizeVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command);

        Task<bool> AuthorizeVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command);

        Task<Referral> DiscloseReferralAsync(ClaimsPrincipal user, Referral referral);

        Task<Arrangement> DiscloseArrangementAsync(ClaimsPrincipal user, Arrangement arrangement);

        Task<VolunteerFamilyInfo> DiscloseVolunteerFamilyInfoAsync(ClaimsPrincipal user, VolunteerFamilyInfo volunteerFamilyInfo);

        Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user, Family family);

        Task<Person> DisclosePersonAsync(ClaimsPrincipal user, Person person);

        Task<bool> DiscloseNoteAsync(ClaimsPrincipal user, Guid familyId, Note note);
    }
}
