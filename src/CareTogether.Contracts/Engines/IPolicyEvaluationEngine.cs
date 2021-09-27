using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed record VolunteerFamilyApprovalStatus(
        ImmutableDictionary<(string Role, string Version), RoleApprovalStatus> FamilyRoleApprovals,
        ImmutableDictionary<Guid, VolunteerApprovalStatus> IndividualVolunteers);

    public sealed record VolunteerApprovalStatus(
        ImmutableDictionary<(string Role, string Version), RoleApprovalStatus> IndividualRoleApprovals);

    public interface IPolicyEvaluationEngine
    {
        Task<bool> AuthorizeReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command, Referral referral);

        Task<bool> AuthorizeArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command, Referral referral);

        Task<bool> AuthorizeArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command, Referral referral);

        Task<bool> AuthorizeVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command, VolunteerFamily volunteerFamily);

        Task<bool> AuthorizeVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command, VolunteerFamily volunteerFamily);


        Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ImmutableList<FormUploadInfo> familyFormUploads,
            ImmutableList<ActivityInfo> familyActivitiesPerformed,
            ImmutableDictionary<Guid,
                (ImmutableList<FormUploadInfo> FormUploads,
                    ImmutableList<ActivityInfo> ActivitiesPerformed)> IndividualInfo);


        Task<Referral> DiscloseReferralAsync(ClaimsPrincipal user, Referral referral);

        Task<Arrangement> DiscloseArrangementAsync(ClaimsPrincipal user, Arrangement arrangement);

        Task<VolunteerFamily> DiscloseVolunteerFamilyAsync(ClaimsPrincipal user, VolunteerFamily volunteerFamily);

        Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user, Family family);

        Task<Person> DisclosePersonAsync(ClaimsPrincipal user, Person person);

        Task<ContactInfo> DiscloseContactInfoAsync(ClaimsPrincipal user, ContactInfo contactInfo);
    }
}
