using CareTogether.Managers;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Engines.Authorization
{
    public sealed class AuthorizationEngine : IAuthorizationEngine
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryResource directoryResource;
        private readonly IReferralsResource referralsResource;


        public AuthorizationEngine(IPoliciesResource policiesResource,
            IDirectoryResource directoryResource, IReferralsResource referralsResource)
        {
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.referralsResource = referralsResource;
        }


        public async Task<bool> AuthorizeFamilyAccessAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Guid familyId)
        {
            // Most common case for highly active users: the user has access to all families.
            if (user.HasPermission(Permission.ViewAllFamilies))
                return true;

            // Less common but simple case: the user is part of the target family.
            var userPersonId = user.PersonId();
            var userFamily = await directoryResource.FindPersonFamilyAsync(organizationId, locationId, userPersonId);
            if (userFamily == null)
                return false; // If the user is not part of a family, the remaining conditions are invalid.

            var targetFamily = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            if (targetFamily.Id == userFamily.Id)
                return true;

            // General case: the user's family is linked to the target family through a referral.
            if (user.HasPermission(Permission.ViewLinkedFamilies))
            {
                var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);

                // Find all linked referrals - that is, referrals where either the user's family is the partnering
                // family or someone from the user's family is assigned to a volunteer role in the referral.
                //TODO: Should the latter case be restricted so only the assigned individual can see others' info?
                //TODO: Should the latter case be restricted so only participating individuals in the family can see others' info?
                var ownReferrals = referrals.Where(referral => referral.FamilyId == userFamily.Id);
                var assignedReferrals = referrals.Where(referral => referral.Arrangements.Any(arrangement =>
                    arrangement.Value.FamilyVolunteerAssignments.Exists(assignment => assignment.FamilyId == userFamily.Id) ||
                    arrangement.Value.IndividualVolunteerAssignments.Exists(assignment => assignment.FamilyId == userFamily.Id)));
                var allLinkedReferrals = ownReferrals.Concat(assignedReferrals).ToImmutableHashSet();

                // Find all families connected to the linked referrals (as either partnering families and assigned volunteers).
                var allVisiblePartneringFamilies = allLinkedReferrals.Select(referral => referral.FamilyId);
                var allVisibleAssignedFamilies = allLinkedReferrals.SelectMany(referral =>
                    referral.Arrangements.SelectMany(arrangement =>
                    {
                        var linkedFamilies = arrangement.Value.FamilyVolunteerAssignments.Select(assignment => assignment.FamilyId);
                        var linkedIndividualFamilies = arrangement.Value.IndividualVolunteerAssignments.Select(assignment => assignment.FamilyId);
                        return linkedFamilies.Concat(linkedIndividualFamilies);
                    }));
                var allVisibleFamilies = allVisiblePartneringFamilies.Concat(allVisibleAssignedFamilies).ToImmutableHashSet();

                return allVisibleFamilies.Contains(familyId);
            }

            return false;
        }

        public async Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, FamilyCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CreateFamily => null,
                    AddAdultToFamily => null,
                    AddChildToFamily => null,
                    UpdateAdultRelationshipToFamily => null,
                    AddCustodialRelationship => null,
                    UpdateCustodialRelationshipType => null,
                    RemoveCustodialRelationship => null,
                    UploadFamilyDocument => Permission.UploadStandaloneDocuments,
                    DeleteUploadedFamilyDocument => null,
                    ChangePrimaryFamilyContact => null,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, familyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CreatePerson => null,
                    UndoCreatePerson => null,
                    UpdatePersonName => null,
                    UpdatePersonGender => null,
                    UpdatePersonAge => null,
                    UpdatePersonEthnicity => null,
                    UpdatePersonUserLink => null,
                    UpdatePersonConcerns => null,
                    UpdatePersonNotes => null,
                    AddPersonAddress => null,
                    UpdatePersonAddress => null,
                    AddPersonPhoneNumber => null,
                    UpdatePersonPhoneNumber => null,
                    AddPersonEmailAddress => null,
                    UpdatePersonEmailAddress => null,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CreateReferral => null,
                    CompleteReferralRequirement => null,
                    MarkReferralRequirementIncomplete => null,
                    ExemptReferralRequirement => null,
                    UnexemptReferralRequirement => null,
                    UpdateCustomReferralField => null,
                    UpdateReferralComments => null,
                    CloseReferral => null,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementsCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CreateArrangement => null,
                    AssignIndividualVolunteer => null,
                    AssignVolunteerFamily => null,
                    UnassignIndividualVolunteer => null,
                    UnassignVolunteerFamily => null,
                    StartArrangements => null,
                    CompleteArrangementRequirement => null,
                    CompleteVolunteerFamilyAssignmentRequirement => null,
                    CompleteIndividualVolunteerAssignmentRequirement => null,
                    MarkArrangementRequirementIncomplete => null,
                    MarkVolunteerFamilyAssignmentRequirementIncomplete => null,
                    MarkIndividualVolunteerAssignmentRequirementIncomplete => null,
                    ExemptArrangementRequirement => null,
                    ExemptVolunteerFamilyAssignmentRequirement => null,
                    ExemptIndividualVolunteerAssignmentRequirement => null,
                    UnexemptArrangementRequirement => null,
                    UnexemptVolunteerFamilyAssignmentRequirement => null,
                    UnexemptIndividualVolunteerAssignmentRequirement => null,
                    TrackChildLocationChange => null,
                    EndArrangements => null,
                    CancelArrangementsSetup => null,
                    UpdateArrangementComments => null,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, NoteCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CreateDraftNote => null,
                    EditDraftNote => null,
                    DiscardDraftNote => null,
                    ApproveNote => null,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user)
        {
            return Task.FromResult(CheckPermission(organizationId, locationId, user,
                permission: null));
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    ActivateVolunteerFamily => null,
                    CompleteVolunteerFamilyRequirement => Permission.EditApprovalRequirementCompletion,
                    MarkVolunteerFamilyRequirementIncomplete => Permission.EditApprovalRequirementCompletion,
                    ExemptVolunteerFamilyRequirement => Permission.EditApprovalRequirementExemption,
                    UnexemptVolunteerFamilyRequirement => Permission.EditApprovalRequirementExemption,
                    UploadVolunteerFamilyDocument => Permission.UploadStandaloneDocuments,
                    RemoveVolunteerFamilyRole => Permission.EditVolunteerRoleParticipation,
                    ResetVolunteerFamilyRole => Permission.EditVolunteerRoleParticipation,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                CheckPermission(organizationId, locationId, user, command switch
                {
                    CompleteVolunteerRequirement => Permission.EditApprovalRequirementCompletion,
                    MarkVolunteerRequirementIncomplete => Permission.EditApprovalRequirementCompletion,
                    ExemptVolunteerRequirement => Permission.EditApprovalRequirementExemption,
                    UnexemptVolunteerRequirement => Permission.EditApprovalRequirementExemption,
                    RemoveVolunteerRole => Permission.EditVolunteerRoleParticipation,
                    ResetVolunteerRole => Permission.EditVolunteerRoleParticipation,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
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

        public async Task<VolunteerFamilyInfo> DiscloseVolunteerFamilyInfoAsync(ClaimsPrincipal user,
            VolunteerFamilyInfo volunteerFamilyInfo)
        {
            await Task.Yield();
            return volunteerFamilyInfo with
            {
                FamilyRoleApprovals = user.HasPermission(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.FamilyRoleApprovals
                    : ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                RemovedRoles = user.HasPermission(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.RemovedRoles
                    : ImmutableList<RemovedRole>.Empty,
                IndividualVolunteers = user.HasPermission(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.IndividualVolunteers
                    : volunteerFamilyInfo.IndividualVolunteers.ToImmutableDictionary(
                        keySelector: kvp => kvp.Key,
                        elementSelector: kvp => kvp.Value with
                        {
                            RemovedRoles = ImmutableList<RemovedRole>.Empty,
                            IndividualRoleApprovals = ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty
                        })
            };
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

        public async Task<bool> DiscloseNoteAsync(ClaimsPrincipal user, Guid familyId, Note note)
        {
            await Task.Yield();
            return true;
        }


        private static bool CheckPermission(Guid organizationId, Guid locationId, ClaimsPrincipal user,
            Permission? permission)
        {
            //TODO: Handle multiple orgs/locations
            return permission == null ? true : user.HasPermission(permission.Value);
        }
    }
}
