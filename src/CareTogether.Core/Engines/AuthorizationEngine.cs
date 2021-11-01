using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed class AuthorizationEngine : IAuthorizationEngine
    {
        private readonly IPoliciesResource policiesResource;


        public AuthorizationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        public async Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
        }

        public async Task<bool> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
        }

        public async Task<bool> AuthorizeArrangementNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementNoteCommand command, Referral referral)
        {
            await Task.Yield();
            return true;
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return true;
        }

        public async Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return true;
        }

        public async Task<Referral> DiscloseReferralAsync(ClaimsPrincipal user, Referral referral)
        {
            await Task.Yield();
            return referral;
        }

        public async Task<Arrangement> DiscloseArrangementAsync(ClaimsPrincipal user, Arrangement arrangement)
        {
            await Task.Yield();
            return arrangement;
        }

        public async Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(ClaimsPrincipal user, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return volunteerFamily;
        }

        public async Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user, Family family)
        {
            await Task.Yield();
            return family;
        }

        public async Task<Person> DisclosePersonAsync(ClaimsPrincipal user, Person person)
        {
            await Task.Yield();
            return person;
        }
    }
}
