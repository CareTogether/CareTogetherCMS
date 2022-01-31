using CareTogether.Managers;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
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


        public Task<bool> AuthorizeFamilyAccessAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, Family family)
        {
            return Task.FromResult(
                user.HasPermission(Permission.ViewAllFamilies));
        }

        public Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, FamilyCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
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
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, PersonCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
            {
                CreatePerson => null,
                UndoCreatePerson => null,
                UpdatePersonName => null,
                UpdatePersonAge => null,
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

        public Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
            {
                CreateReferral => null,
                CompleteReferralRequirement => null,
                ExemptReferralRequirement => null,
                UnexemptReferralRequirement => null,
                CloseReferral => null,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public Task<bool> AuthorizeArrangementCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
            {
                CreateArrangement => null,
                AssignIndividualVolunteer => null,
                AssignVolunteerFamily => null,
                StartArrangement => null,
                CompleteArrangementRequirement => null,
                ExemptArrangementRequirement => null,
                UnexemptArrangementRequirement => null,
                TrackChildLocationChange => null,
                EndArrangement => null,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, NoteCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
            {
                CreateDraftNote => null,
                EditDraftNote => null,
                DiscardDraftNote => null,
                ApproveNote => null,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
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

        public Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerCommand command)
        {
            //TODO: Enforce own/linked/all-families scope permissions in addition to these action type permissions!
            return CheckPermission(organizationId, locationId, user, command switch
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

        public async Task<VolunteerFamilyInfo> DiscloseVolunteerFamilyInfoAsync(ClaimsPrincipal user, VolunteerFamilyInfo volunteerFamilyInfo)
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


        private Task<bool> CheckPermission(Guid organizationId, Guid locationId, ClaimsPrincipal user,
            Permission? permission)
        {
            //TODO: Handle multiple orgs/locations
            return Task.FromResult(permission == null ? true : user.HasPermission(permission.Value));
        }
    }
}
