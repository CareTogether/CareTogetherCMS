using CareTogether.Managers;
using CareTogether.Resources;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        private readonly IPoliciesResource policiesResource;


        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ArrangementCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeArrangementNoteCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ArrangementNoteCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, ReferralCommand command, Referral referral)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, VolunteerCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, AuthorizedUser user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return new Yes();
            //throw new NotImplementedException();
        }

        public async Task<Arrangement> DiscloseArrangementAsync(AuthorizedUser user, Arrangement arrangement)
        {
            await Task.Yield();
            return arrangement;
            //throw new NotImplementedException();
        }

        public async Task<ContactInfo> DiscloseContactInfoAsync(AuthorizedUser user, ContactInfo contactInfo)
        {
            await Task.Yield();
            return contactInfo;
            //throw new NotImplementedException();
        }

        public async Task<Family> DiscloseFamilyAsync(AuthorizedUser user, Family family)
        {
            await Task.Yield();
            return family;
            //throw new NotImplementedException();
        }

        public async Task<Person> DisclosePersonAsync(AuthorizedUser user, Person person)
        {
            await Task.Yield();
            return person;
            //throw new NotImplementedException();
        }

        public async Task<Referral> DiscloseReferralAsync(AuthorizedUser user, Referral referral)
        {
            await Task.Yield();
            return referral;
            //throw new NotImplementedException();
        }

        public async Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(AuthorizedUser user, VolunteerFamily volunteerFamily)
        {
            await Task.Yield();
            return volunteerFamily;
            //throw new NotImplementedException();
        }
    }
}
