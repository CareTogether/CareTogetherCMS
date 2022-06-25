using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;
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
            if (user.HasPermission(organizationId, locationId, Permission.ViewAllFamilies))
                return true;

            // Less common but simple case: the user is part of the target family.
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily = await directoryResource.FindPersonFamilyAsync(organizationId, locationId, userPersonId);
            if (userFamily == null)
                return false; // If the user is not part of a family, the remaining conditions are invalid.

            var targetFamily = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            if (targetFamily.Id == userFamily.Id)
                return true;

            // General case: the user's family is linked to the target family through a referral.
            if (user.HasPermission(organizationId, locationId, Permission.ViewLinkedFamilies))
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
                user.HasPermission(organizationId, locationId, command switch
                {
                    CreateFamily => Permission.EditFamilyInfo,
                    AddAdultToFamily => Permission.EditFamilyInfo,
                    AddChildToFamily => Permission.EditFamilyInfo,
                    UpdateAdultRelationshipToFamily => Permission.EditFamilyInfo,
                    AddCustodialRelationship => Permission.EditFamilyInfo,
                    UpdateCustodialRelationshipType => Permission.EditFamilyInfo,
                    RemoveCustodialRelationship => Permission.EditFamilyInfo,
                    UploadFamilyDocument => Permission.UploadFamilyDocuments,
                    DeleteUploadedFamilyDocument => Permission.DeleteFamilyDocuments,
                    ChangePrimaryFamilyContact => Permission.EditFamilyInfo,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, familyId) &&
                user.HasPermission(organizationId, locationId, command switch
                {
                    CreatePerson => Permission.EditFamilyInfo,
                    UndoCreatePerson => Permission.EditFamilyInfo,
                    UpdatePersonName => Permission.EditFamilyInfo,
                    UpdatePersonGender => Permission.EditFamilyInfo,
                    UpdatePersonAge => Permission.EditFamilyInfo,
                    UpdatePersonEthnicity => Permission.EditFamilyInfo,
                    UpdatePersonUserLink => Permission.EditPersonUserLink,
                    UpdatePersonConcerns => Permission.EditPersonConcerns,
                    UpdatePersonNotes => Permission.EditPersonNotes,
                    AddPersonAddress => Permission.EditPersonContactInfo,
                    UpdatePersonAddress => Permission.EditPersonContactInfo,
                    AddPersonPhoneNumber => Permission.EditPersonContactInfo,
                    UpdatePersonPhoneNumber => Permission.EditPersonContactInfo,
                    AddPersonEmailAddress => Permission.EditPersonContactInfo,
                    UpdatePersonEmailAddress => Permission.EditPersonContactInfo,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ReferralCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                user.HasPermission(organizationId, locationId, command switch
                {
                    CreateReferral => Permission.CreateReferral,
                    CompleteReferralRequirement => Permission.EditReferralRequirementCompletion,
                    MarkReferralRequirementIncomplete => Permission.EditReferralRequirementCompletion,
                    ExemptReferralRequirement => Permission.EditReferralRequirementExemption,
                    UnexemptReferralRequirement => Permission.EditReferralRequirementExemption,
                    UpdateCustomReferralField => Permission.EditReferral,
                    UpdateReferralComments => Permission.EditReferral,
                    CloseReferral => Permission.CloseReferral,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, ArrangementsCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                user.HasPermission(organizationId, locationId, command switch
                {
                    CreateArrangement => Permission.CreateArrangement,
                    AssignIndividualVolunteer => Permission.EditAssignments,
                    AssignVolunteerFamily => Permission.EditAssignments,
                    UnassignIndividualVolunteer => Permission.EditAssignments,
                    UnassignVolunteerFamily => Permission.EditAssignments,
                    StartArrangements => Permission.EditArrangement,
                    CompleteArrangementRequirement => Permission.EditArrangementRequirementCompletion,
                    CompleteVolunteerFamilyAssignmentRequirement => Permission.EditArrangementRequirementCompletion,
                    CompleteIndividualVolunteerAssignmentRequirement => Permission.EditArrangementRequirementCompletion,
                    MarkArrangementRequirementIncomplete => Permission.EditArrangementRequirementCompletion,
                    MarkVolunteerFamilyAssignmentRequirementIncomplete => Permission.EditArrangementRequirementCompletion,
                    MarkIndividualVolunteerAssignmentRequirementIncomplete => Permission.EditArrangementRequirementCompletion,
                    ExemptArrangementRequirement => Permission.EditArrangementRequirementExemption,
                    ExemptVolunteerFamilyAssignmentRequirement => Permission.EditArrangementRequirementExemption,
                    ExemptIndividualVolunteerAssignmentRequirement => Permission.EditArrangementRequirementExemption,
                    UnexemptArrangementRequirement => Permission.EditArrangementRequirementExemption,
                    UnexemptVolunteerFamilyAssignmentRequirement => Permission.EditArrangementRequirementExemption,
                    UnexemptIndividualVolunteerAssignmentRequirement => Permission.EditArrangementRequirementExemption,
                    TrackChildLocationChange => Permission.TrackChildLocationChange,
                    EndArrangements => Permission.EditArrangement,
                    CancelArrangementsSetup => Permission.EditArrangement,
                    UpdateArrangementComments => Permission.EditArrangement,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public async Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, NoteCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                user.HasPermission(organizationId, locationId, command switch
                {
                    CreateDraftNote => Permission.AddEditDraftNotes,
                    EditDraftNote => Permission.AddEditDraftNotes,
                    DiscardDraftNote => Permission.DiscardDraftNotes,
                    ApproveNote => Permission.ApproveNotes,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                });
        }

        public Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user)
        {
            return Task.FromResult(
                user.HasPermission(organizationId, locationId, Permission.SendBulkSms));
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            return await AuthorizeFamilyAccessAsync(organizationId, locationId, user, command.FamilyId) &&
                user.HasPermission(organizationId, locationId, command switch
                {
                    ActivateVolunteerFamily => Permission.ActivateVolunteerFamily,
                    CompleteVolunteerFamilyRequirement => Permission.EditApprovalRequirementCompletion,
                    MarkVolunteerFamilyRequirementIncomplete => Permission.EditApprovalRequirementCompletion,
                    ExemptVolunteerFamilyRequirement => Permission.EditApprovalRequirementExemption,
                    UnexemptVolunteerFamilyRequirement => Permission.EditApprovalRequirementExemption,
                    UploadVolunteerFamilyDocument => Permission.UploadFamilyDocuments,
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
                user.HasPermission(organizationId, locationId, command switch
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
        
        public async Task<PartneringFamilyInfo> DisclosePartneringFamilyInfoAsync(ClaimsPrincipal user,
            PartneringFamilyInfo partneringFamilyInfo, Guid organizationId, Guid locationId)
        {
            return partneringFamilyInfo with
            {
                OpenReferral = partneringFamilyInfo.OpenReferral != null
                    ? await DiscloseReferral(user, partneringFamilyInfo.OpenReferral, organizationId, locationId)
                    : null,
                ClosedReferrals = (await partneringFamilyInfo.ClosedReferrals
                    .Select(closedReferral => DiscloseReferral(user, closedReferral, organizationId, locationId))
                    .WhenAll())
                    .ToImmutableList(),
                History = user.HasPermission(organizationId, locationId, Permission.ViewReferralHistory)
                    ? partneringFamilyInfo.History
                    : ImmutableList<Activity>.Empty
            };
        }


        internal async Task<Referral> DiscloseReferral(ClaimsPrincipal user,
            Referral referral, Guid organizationId, Guid locationId)
        {
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily = await directoryResource.FindPersonFamilyAsync(organizationId, locationId, userPersonId);

            return referral with
            {
                CompletedCustomFields = user.HasPermission(organizationId, locationId, Permission.ViewReferralCustomFields)
                    ? referral.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                MissingCustomFields = user.HasPermission(organizationId, locationId, Permission.ViewReferralCustomFields)
                    ? referral.MissingCustomFields
                    : ImmutableList<string>.Empty,
                CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewReferralProgress)
                    ? referral.CompletedRequirements
                    : ImmutableList<CompletedRequirementInfo>.Empty,
                ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewReferralProgress)
                    ? referral.ExemptedRequirements
                    : ImmutableList<ExemptedRequirementInfo>.Empty,
                MissingRequirements = user.HasPermission(organizationId, locationId, Permission.ViewReferralProgress)
                    ? referral.MissingRequirements
                    : ImmutableList<string>.Empty,
                CloseReason = user.HasPermission(organizationId, locationId, Permission.ViewReferralComments)
                    ? referral.CloseReason
                    : null,
                Comments = user.HasPermission(organizationId, locationId, Permission.ViewReferralComments)
                    ? referral.Comments
                    : null,
                Arrangements = referral.Arrangements
                    .Select(arrangement =>
                        arrangement with
                        {
                            ChildLocationHistory = user.HasPermission(organizationId, locationId, Permission.ViewChildLocationHistory)
                                ? arrangement.ChildLocationHistory
                                : ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                            Comments = user.HasPermission(organizationId, locationId, Permission.ViewReferralComments)
                                ? arrangement.Comments
                                : null,
                            CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                ? arrangement.CompletedRequirements
                                : ImmutableList<CompletedRequirementInfo>.Empty,
                            ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                ? arrangement.ExemptedRequirements
                                : ImmutableList<ExemptedRequirementInfo>.Empty,
                            MissingRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                ? arrangement.MissingRequirements
                                : user.HasPermission(organizationId, locationId, Permission.ViewAssignedArrangementProgress)
                                    && userFamily != null
                                ? arrangement.MissingRequirements
                                    .Where(m => m.VolunteerFamilyId == userFamily.Id)
                                    .ToImmutableList()
                                : ImmutableList<MissingArrangementRequirement>.Empty,
                            IndividualVolunteerAssignments = user.HasPermission(organizationId, locationId, Permission.ViewAssignments)
                                ? arrangement.IndividualVolunteerAssignments
                                    .Select(iva => iva with
                                    {
                                        CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                            ? iva.CompletedRequirements
                                            : user.HasPermission(organizationId, locationId, Permission.ViewAssignedArrangementProgress)
                                                && iva.FamilyId == userFamily?.Id
                                            ? iva.CompletedRequirements
                                            : ImmutableList<CompletedRequirementInfo>.Empty,
                                        ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                            ? iva.ExemptedRequirements
                                            : user.HasPermission(organizationId, locationId, Permission.ViewAssignedArrangementProgress)
                                                && iva.FamilyId == userFamily?.Id
                                            ? iva.ExemptedRequirements
                                            : ImmutableList<ExemptedRequirementInfo>.Empty
                                    }).ToImmutableList()
                                : ImmutableList<IndividualVolunteerAssignment>.Empty,
                            FamilyVolunteerAssignments = user.HasPermission(organizationId, locationId, Permission.ViewAssignments)
                                ? arrangement.FamilyVolunteerAssignments
                                    .Select(fva => fva with
                                    {
                                        CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                            ? fva.CompletedRequirements
                                            : user.HasPermission(organizationId, locationId, Permission.ViewAssignedArrangementProgress)
                                                && fva.FamilyId == userFamily?.Id
                                            ? fva.CompletedRequirements
                                            : ImmutableList<CompletedRequirementInfo>.Empty,
                                        ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewArrangementProgress)
                                            ? fva.ExemptedRequirements
                                            : user.HasPermission(organizationId, locationId, Permission.ViewAssignedArrangementProgress)
                                                && fva.FamilyId == userFamily?.Id
                                            ? fva.ExemptedRequirements
                                            : ImmutableList<ExemptedRequirementInfo>.Empty
                                    }).ToImmutableList()
                                : ImmutableList<FamilyVolunteerAssignment>.Empty
                        })
                    .ToImmutableList()
            };
        }

        public Task<VolunteerFamilyInfo> DiscloseVolunteerFamilyInfoAsync(ClaimsPrincipal user,
            VolunteerFamilyInfo volunteerFamilyInfo, Guid organizationId, Guid locationId)
        {
            return Task.FromResult(volunteerFamilyInfo with
            {
                FamilyRoleApprovals = user.HasPermission(organizationId, locationId, Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.FamilyRoleApprovals
                    : ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                RemovedRoles = user.HasPermission(organizationId, locationId, Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.RemovedRoles
                    : ImmutableList<RemovedRole>.Empty,
                IndividualVolunteers = volunteerFamilyInfo.IndividualVolunteers.ToImmutableDictionary(
                        keySelector: kvp => kvp.Key,
                        elementSelector: kvp => kvp.Value with
                        {
                            RemovedRoles = user.HasPermission(organizationId, locationId, Permission.ViewApprovalStatus)
                                ? kvp.Value.RemovedRoles
                                : ImmutableList<RemovedRole>.Empty,
                            IndividualRoleApprovals = user.HasPermission(organizationId, locationId, Permission.ViewApprovalStatus)
                                ? kvp.Value.IndividualRoleApprovals
                                : ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                            AvailableApplications = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                                ? kvp.Value.AvailableApplications
                                : ImmutableList<string>.Empty,
                            CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                                ? kvp.Value.CompletedRequirements
                                : ImmutableList<CompletedRequirementInfo>.Empty,
                            ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                                ? kvp.Value.ExemptedRequirements
                                : ImmutableList<ExemptedRequirementInfo>.Empty,
                            MissingRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                                ? kvp.Value.MissingRequirements
                                : ImmutableList<string>.Empty,
                        }),
                AvailableApplications = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.AvailableApplications
                    : ImmutableList<string>.Empty,
                CompletedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.CompletedRequirements
                    : ImmutableList<CompletedRequirementInfo>.Empty,
                ExemptedRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.ExemptedRequirements
                    : ImmutableList<ExemptedRequirementInfo>.Empty,
                MissingRequirements = user.HasPermission(organizationId, locationId, Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.MissingRequirements
                    : ImmutableList<string>.Empty,
                History = user.HasPermission(organizationId, locationId, Permission.ViewApprovalHistory)
                    ? volunteerFamilyInfo.History
                    : ImmutableList<Activity>.Empty
            });
        }

        public Task<Family> DiscloseFamilyAsync(ClaimsPrincipal user,
            Family family, Guid organizationId, Guid locationId)
        {
            return Task.FromResult(family with
            {
                Adults = family.Adults
                    .Select(adult =>
                        (DisclosePersonAsync(user, adult.Item1, organizationId, locationId),
                            adult.Item2))
                    .ToImmutableList(),
                Children = family.Children
                    .Select(child => DisclosePersonAsync(user, child, organizationId, locationId))
                    .ToImmutableList(),
                DeletedDocuments = user.HasPermission(organizationId, locationId, Permission.ViewFamilyDocumentMetadata)
                    ? family.DeletedDocuments
                    : ImmutableList<Guid>.Empty,
                UploadedDocuments = user.HasPermission(organizationId, locationId, Permission.ViewFamilyDocumentMetadata)
                    ? family.UploadedDocuments
                    : ImmutableList<UploadedDocumentInfo>.Empty,
                History = user.HasPermission(organizationId, locationId, Permission.ViewFamilyHistory)
                    ? family.History
                    : ImmutableList<Activity>.Empty
            });
        }

        internal static Person DisclosePersonAsync(ClaimsPrincipal user,
            Person person, Guid organizationId, Guid locationId) =>
            person with
            {
                Concerns = user.HasPermission(organizationId, locationId, Permission.ViewPersonConcerns)
                    ? person.Concerns
                    : null,
                Notes = user.HasPermission(organizationId, locationId, Permission.ViewPersonNotes)
                    ? person.Notes
                    : null,
                Addresses = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.Addresses
                    : ImmutableList<Address>.Empty,
                CurrentAddressId = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.CurrentAddressId
                    : null,
                EmailAddresses = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.EmailAddresses
                    : ImmutableList<EmailAddress>.Empty,
                PreferredEmailAddressId = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.PreferredEmailAddressId
                    : null,
                PhoneNumbers = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.PhoneNumbers
                    : ImmutableList<PhoneNumber>.Empty,
                PreferredPhoneNumberId = user.HasPermission(organizationId, locationId, Permission.ViewPersonContactInfo)
                    ? person.PreferredPhoneNumberId
                    : null
            };

        public async Task<bool> DiscloseNoteAsync(ClaimsPrincipal user,
            Guid familyId, Note note, Guid organizationId, Guid locationId)
        {
            var author = await directoryResource.FindUserAsync(organizationId, locationId, note.AuthorId);
            return author.Id == user.PersonId(organizationId, locationId) ||
                user.HasPermission(organizationId, locationId, Permission.ViewAllNotes);
        }
    }
}
