using CareTogether.Managers;
using CareTogether.Resources;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed record VolunteerFamilyApprovalStatus(
        ImmutableDictionary<string, RoleApprovalStatus> FamilyRoleApprovals,
        ImmutableDictionary<Guid, VolunteerApprovalStatus> IndividualVolunteers);

    public sealed record VolunteerApprovalStatus(
        ImmutableDictionary<string, RoleApprovalStatus> IndividualRoleApprovals);

    public interface IPolicyEvaluationEngine
    {
        Task<OneOf<Yes, Error<string>>> AuthorizeReferralCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ReferralCommand command, Referral referral);

        Task<OneOf<Yes, Error<string>>> AuthorizeArrangementCommandAsync(Guid organizationId, Guid locationId, 
            AuthorizedUser user, ArrangementCommand command, Referral referral);

        Task<OneOf<Yes, Error<string>>> AuthorizeArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementNoteCommand command, Referral referral);

        Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily);

        Task<OneOf<Yes, Error<string>>> AuthorizeVolunteerCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, VolunteerCommand command, VolunteerFamily volunteerFamily);


        Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<FormUploadInfo> familyFormUploads,
            ImmutableList<ActivityInfo> familyActivitiesPerformed,
            Dictionary<Guid,
                (ImmutableList<FormUploadInfo> FormUploads,
                    ImmutableList<ActivityInfo> ActivitiesPerformed)> IndividualInfo);


        Task<Referral> DiscloseReferralAsync(AuthorizedUser user, Referral referral);

        Task<Arrangement> DiscloseArrangementAsync(AuthorizedUser user, Arrangement arrangement);
        
        Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(AuthorizedUser user, VolunteerFamily volunteerFamily);

        Task<Family> DiscloseFamilyAsync(AuthorizedUser user, Family family);

        Task<Person> DisclosePersonAsync(AuthorizedUser user, Person person);

        Task<ContactInfo> DiscloseContactInfoAsync(AuthorizedUser user, ContactInfo contactInfo);
    }
}
