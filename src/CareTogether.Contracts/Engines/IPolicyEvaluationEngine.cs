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
    public interface IPolicyEvaluationEngine
    {
        Task<OneOf<Yes, Error<string>>> AuthorizeReferralCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ReferralCommand command, Referral referral);

        Task<OneOf<Yes, Error<string>>> AuthorizeArrangementCommandAsync(Guid organizationId, Guid locationId, 
            AuthorizedUser user, ArrangementCommand command, Referral referral);

        Task<OneOf<Yes, Error<string>>> AuthorizeArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementNoteCommand command, Referral referral);


        //Task CalculateVolunteerApprovalStatusAsync(Guid VolunteerId);


        Task<Referral> DiscloseReferralAsync(AuthorizedUser user, Referral referral);

        Task<Arrangement> DiscloseArrangementAsync(AuthorizedUser user, Arrangement arrangement);

        Task<Family> DiscloseFamilyAsync(AuthorizedUser user, Family family);

        Task<Person> DisclosePersonAsync(AuthorizedUser user, Person person);

        Task<ContactInfo> DiscloseContactInfoAsync(AuthorizedUser user, ContactInfo contactInfo);
    }
}
