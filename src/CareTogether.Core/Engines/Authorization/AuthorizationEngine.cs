using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;

namespace CareTogether.Engines.Authorization
{
    public sealed class AuthorizationEngine : IAuthorizationEngine
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryResource directoryResource;
        private readonly IAccountsResource accountsResource;
        private readonly INotesResource notesResource;
        private readonly IUserAccessCalculation userAccessCalculation;

        public AuthorizationEngine(
            IPoliciesResource policiesResource,
            IDirectoryResource directoryResource,
            IAccountsResource accountsResource,
            INotesResource notesResource,
            IUserAccessCalculation userAccessCalculation
        )
        {
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.accountsResource = accountsResource;
            this.notesResource = notesResource;
            this.userAccessCalculation = userAccessCalculation;
        }

        public async Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            FamilyCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    CreateFamily => Permission.EditFamilyInfo,
                    UndoCreateFamily => Permission.EditFamilyInfo,
                    AddAdultToFamily => Permission.EditFamilyInfo,
                    AddChildToFamily => Permission.EditFamilyInfo,
                    ConvertChildToAdult => Permission.EditFamilyInfo,
                    UpdateAdultRelationshipToFamily => Permission.EditFamilyInfo,
                    AddCustodialRelationship => Permission.EditFamilyInfo,
                    UpdateCustodialRelationshipType => Permission.EditFamilyInfo,
                    RemoveCustodialRelationship => Permission.EditFamilyInfo,
                    UploadFamilyDocument => Permission.UploadFamilyDocuments,
                    DeleteUploadedFamilyDocument => Permission.DeleteFamilyDocuments,
                    ChangePrimaryFamilyContact => Permission.EditFamilyInfo,
                    UpdateCustomFamilyField => Permission.EditFamilyInfo,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            PersonCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(familyId)
            );
            return permissions.Contains(
                command switch
                {
                    CreatePerson => Permission.EditFamilyInfo,
                    UndoCreatePerson => Permission.EditFamilyInfo,
                    UpdatePersonName => Permission.EditFamilyInfo,
                    UpdatePersonGender => Permission.EditFamilyInfo,
                    UpdatePersonAge => Permission.EditFamilyInfo,
                    UpdatePersonEthnicity => Permission.EditFamilyInfo,
                    UpdatePersonConcerns => Permission.EditPersonConcerns,
                    UpdatePersonNotes => Permission.EditPersonNotes,
                    AddPersonAddress => Permission.EditPersonContactInfo,
                    UpdatePersonAddress => Permission.EditPersonContactInfo,
                    AddPersonPhoneNumber => Permission.EditPersonContactInfo,
                    UpdatePersonPhoneNumber => Permission.EditPersonContactInfo,
                    AddPersonEmailAddress => Permission.EditPersonContactInfo,
                    UpdatePersonEmailAddress => Permission.EditPersonContactInfo,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeReferralCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            ReferralCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    CreateReferral => Permission.CreateReferral,
                    CompleteReferralRequirement => Permission.EditReferralRequirementCompletion,
                    MarkReferralRequirementIncomplete =>
                        Permission.EditReferralRequirementCompletion,
                    ExemptReferralRequirement => Permission.EditReferralRequirementExemption,
                    UnexemptReferralRequirement => Permission.EditReferralRequirementExemption,
                    UpdateCustomReferralField => Permission.EditReferral,
                    UpdateReferralComments => Permission.EditReferral,
                    CloseReferral => Permission.CloseReferral,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            ArrangementsCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    CreateArrangement => Permission.CreateArrangement,
                    AssignIndividualVolunteer => Permission.EditAssignments,
                    AssignVolunteerFamily => Permission.EditAssignments,
                    UnassignIndividualVolunteer => Permission.EditAssignments,
                    UnassignVolunteerFamily => Permission.EditAssignments,
                    PlanArrangementStart => Permission.EditArrangement,
                    StartArrangements => Permission.EditArrangement,
                    EditArrangementStartTime => Permission.EditArrangement,
                    EditArrangementEndTime => Permission.EditArrangement,
                    EditArrangementRequestedAt => Permission.EditArrangement,
                    EditArrangementCancelledAt => Permission.EditArrangement,
                    CompleteArrangementRequirement =>
                        Permission.EditArrangementRequirementCompletion,
                    CompleteVolunteerFamilyAssignmentRequirement =>
                        Permission.EditArrangementRequirementCompletion,
                    CompleteIndividualVolunteerAssignmentRequirement =>
                        Permission.EditArrangementRequirementCompletion,
                    MarkArrangementRequirementIncomplete =>
                        Permission.EditArrangementRequirementCompletion,
                    MarkVolunteerFamilyAssignmentRequirementIncomplete =>
                        Permission.EditArrangementRequirementCompletion,
                    MarkIndividualVolunteerAssignmentRequirementIncomplete =>
                        Permission.EditArrangementRequirementCompletion,
                    ExemptArrangementRequirement => Permission.EditArrangementRequirementExemption,
                    ExemptVolunteerFamilyAssignmentRequirement =>
                        Permission.EditArrangementRequirementExemption,
                    ExemptIndividualVolunteerAssignmentRequirement =>
                        Permission.EditArrangementRequirementExemption,
                    UnexemptArrangementRequirement =>
                        Permission.EditArrangementRequirementExemption,
                    UnexemptVolunteerFamilyAssignmentRequirement =>
                        Permission.EditArrangementRequirementExemption,
                    UnexemptIndividualVolunteerAssignmentRequirement =>
                        Permission.EditArrangementRequirementExemption,
                    PlanChildLocationChange => Permission.TrackChildLocationChange,
                    DeletePlannedChildLocationChange => Permission.TrackChildLocationChange,
                    TrackChildLocationChange => Permission.TrackChildLocationChange,
                    DeleteChildLocationChange => Permission.TrackChildLocationChange,
                    PlanArrangementEnd => Permission.EditArrangement,
                    EndArrangements => Permission.EditArrangement,
                    ReopenArrangements => Permission.EditArrangement,
                    CancelArrangementsSetup => Permission.EditArrangement,
                    UpdateArrangementComments => Permission.EditArrangement,
                    EditArrangementReason => Permission.EditArrangement,
                    DeleteArrangements => Permission.DeleteArrangement,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            NoteCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );

            var hasPermission = permissions.Contains(
                command switch
                {
                    CreateDraftNote => Permission.AddEditDraftNotes,
                    EditDraftNote => Permission.AddEditDraftNotes,
                    DiscardDraftNote => Permission.DiscardDraftNotes,
                    ApproveNote => Permission.ApproveNotes,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );

            if (hasPermission)
            {
                return true;
            }

            var hasPermissionForOwnNotes = permissions.Contains(
                command switch
                {
                    CreateDraftNote => Permission.AddEditOwnDraftNotes,
                    EditDraftNote => Permission.AddEditOwnDraftNotes,
                    DiscardDraftNote => Permission.DiscardOwnDraftNotes,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );

            if (!hasPermissionForOwnNotes)
            {
                // At this point, if the user does not have permission to edit their own notes, they cannot edit any notes.
                return false;
            }

            if (command is CreateDraftNote)
            {
                // If the command is to create a draft note, we can allow it if the user has permission to edit their own notes.
                return true;
            }

            // If the user has permission to edit their own notes, check if the note belongs to them.

            var familyNotes = await notesResource.ListFamilyNotesAsync(
                organizationId,
                locationId,
                command.FamilyId
            );

            var noteEntry = familyNotes.FirstOrDefault(note => note.Id == command.NoteId);

            if (noteEntry == null)
                return false;

            var noteBelongsToUser = command switch
            {
                EditDraftNote c => noteEntry?.AuthorId == user.UserId(),
                DiscardDraftNote c => noteEntry?.AuthorId == user.UserId(),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

            return noteBelongsToUser;
        }

        public async Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new AllVolunteerFamiliesAuthorizationContext()
            ); //TODO: This could simplify down to 'Global'
            return permissions.Contains(Permission.SendBulkSms);
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            VolunteerFamilyCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    ActivateVolunteerFamily => Permission.ActivateVolunteerFamily,
                    CompleteVolunteerFamilyRequirement =>
                        Permission.EditApprovalRequirementCompletion,
                    MarkVolunteerFamilyRequirementIncomplete =>
                        Permission.EditApprovalRequirementCompletion,
                    ExemptVolunteerFamilyRequirement => Permission.EditApprovalRequirementExemption,
                    UnexemptVolunteerFamilyRequirement =>
                        Permission.EditApprovalRequirementExemption,
                    UploadVolunteerFamilyDocument => Permission.UploadFamilyDocuments,
                    RemoveVolunteerFamilyRole => Permission.EditVolunteerRoleParticipation,
                    ResetVolunteerFamilyRole => Permission.EditVolunteerRoleParticipation,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeVolunteerCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            VolunteerCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    CompleteVolunteerRequirement => Permission.EditApprovalRequirementCompletion,
                    MarkVolunteerRequirementIncomplete =>
                        Permission.EditApprovalRequirementCompletion,
                    ExemptVolunteerRequirement => Permission.EditApprovalRequirementExemption,
                    UnexemptVolunteerRequirement => Permission.EditApprovalRequirementExemption,
                    RemoveVolunteerRole => Permission.EditVolunteerRoleParticipation,
                    ResetVolunteerRole => Permission.EditVolunteerRoleParticipation,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeCommunityCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CommunityCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new CommunityAuthorizationContext(command.CommunityId)
            );
            return permissions.Contains(
                command switch
                {
                    CreateCommunity => Permission.CreateCommunity,
                    RenameCommunity => Permission.EditCommunity,
                    EditCommunityDescription => Permission.EditCommunity,
                    AddCommunityMemberFamily => Permission.EditCommunityMemberFamilies,
                    RemoveCommunityMemberFamily => Permission.EditCommunityMemberFamilies,
                    AddCommunityRoleAssignment => Permission.EditCommunityRoleAssignments,
                    RemoveCommunityRoleAssignment => Permission.EditCommunityRoleAssignments,
                    UploadCommunityDocument => Permission.UploadCommunityDocuments,
                    DeleteUploadedCommunityDocument => Permission.DeleteCommunityDocuments,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizePersonAccessCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            PersonAccessCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new GlobalAuthorizationContext()
            );

            if (command is not ChangePersonRoles c)
                throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                );

            // Determine if any of the roles being added or removed are defined as protected roles.
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            var protectedRoles = configuration
                .Roles.Where(role => role.IsProtected == true)
                .Select(role => role.RoleName)
                .ToImmutableHashSet();
            // HACK: If the person doesn't yet have an activated user account, we can assume that removing
            //       protected roles is okay, which means we don't have to change the IAccountsResource interface.
            var targetPersonAccount = await accountsResource.TryGetPersonUserAccountAsync(
                organizationId,
                locationId,
                command.PersonId
            );
            var targetPersonCurrentRoles =
                targetPersonAccount == null
                    ? ImmutableHashSet<string>.Empty
                    : targetPersonAccount
                        .Organizations.Single(org => org.OrganizationId == organizationId)
                        .Locations.Single(loc => loc.LocationId == locationId)
                        .Roles.ToImmutableHashSet();
            var rolesBeingAddedOrRemoved = targetPersonCurrentRoles.SymmetricExcept(c.Roles);
            var anyRolesBeingAddedOrRemovedAreProtected =
                protectedRoles.Intersect(rolesBeingAddedOrRemoved).Count > 0;

            return permissions.Contains(
                anyRolesBeingAddedOrRemovedAreProtected
                    ? Permission.EditPersonUserProtectedRoles
                    : Permission.EditPersonUserStandardRoles
            );
        }

        public async Task<bool> AuthorizeGenerateUserInviteNonceAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new GlobalAuthorizationContext()
            );
            return permissions.Contains(Permission.InvitePersonUser);
        }

        public async Task<CombinedFamilyInfo> DiscloseFamilyAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            CombinedFamilyInfo family
        )
        {
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily =
                userPersonId == null
                    ? null
                    : await directoryResource.FindPersonFamilyAsync(
                        organizationId,
                        locationId,
                        userPersonId.Value
                    );

            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(family.Family.Id)
            );

            return family with
            {
                PartneringFamilyInfo =
                    family.PartneringFamilyInfo == null
                        ? null
                        : DisclosePartneringFamilyInfo(
                            family.PartneringFamilyInfo,
                            userFamily,
                            contextPermissions
                        ),
                VolunteerFamilyInfo =
                    family.VolunteerFamilyInfo == null
                        ? null
                        : DiscloseVolunteerFamilyInfo(
                            family.VolunteerFamilyInfo,
                            contextPermissions
                        ),
                Family = DiscloseFamily(family.Family, contextPermissions),
                Notes = (
                    await family
                        .Notes.Select(async note =>
                            (
                                note,
                                canDisclose: await DiscloseNoteAsync(
                                    note,
                                    organizationId,
                                    locationId,
                                    userPersonId,
                                    contextPermissions
                                )
                            )
                        )
                        .WhenAll()
                )
                    .Where(x => x.canDisclose)
                    .Select(x => x.note)
                    .ToImmutableList(),
                UploadedDocuments = family.UploadedDocuments, //TODO: Disclosure logic is needed here as well,
                MissingCustomFields = contextPermissions.Contains(Permission.ViewFamilyCustomFields)
                    ? family.MissingCustomFields
                    : ImmutableList<string>.Empty,
                UserPermissions = contextPermissions,
            };
        }

        public async Task<CommunityInfo> DiscloseCommunityAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId,
            CommunityInfo community
        )
        {
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new CommunityAuthorizationContext(community.Community.Id)
            );

            return community with
            {
                Community = community.Community with
                {
                    UploadedDocuments = contextPermissions.Contains(
                        Permission.ViewCommunityDocumentMetadata
                    )
                        ? community.Community.UploadedDocuments
                        : ImmutableList<UploadedDocumentInfo>.Empty,
                },
                UserPermissions = contextPermissions,
            };
        }

        internal PartneringFamilyInfo DisclosePartneringFamilyInfo(
            PartneringFamilyInfo partneringFamilyInfo,
            Family? userFamily,
            ImmutableList<Permission> contextPermissions
        )
        {
            return partneringFamilyInfo with
            {
                OpenReferral =
                    partneringFamilyInfo.OpenReferral != null
                        ? DiscloseReferral(
                            partneringFamilyInfo.OpenReferral,
                            userFamily,
                            contextPermissions
                        )
                        : null,
                ClosedReferrals = partneringFamilyInfo
                    .ClosedReferrals.Select(closedReferral =>
                        DiscloseReferral(closedReferral, userFamily, contextPermissions)
                    )
                    .ToImmutableList(),
                History = contextPermissions.Contains(Permission.ViewReferralHistory)
                    ? partneringFamilyInfo.History
                    : ImmutableList<Activity>.Empty,
            };
        }

        internal Referral DiscloseReferral(
            Referral referral,
            Family? userFamily,
            ImmutableList<Permission> contextPermissions
        )
        {
            return referral with
            {
                CompletedCustomFields = contextPermissions.Contains(
                    Permission.ViewReferralCustomFields
                )
                    ? referral.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                MissingCustomFields = contextPermissions.Contains(
                    Permission.ViewReferralCustomFields
                )
                    ? referral.MissingCustomFields
                    : ImmutableList<string>.Empty,
                CompletedRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.CompletedRequirements
                    : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ExemptedRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.ExemptedRequirements
                    : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                MissingRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.MissingRequirements
                    : ImmutableList<string>.Empty,
                CloseReason = contextPermissions.Contains(Permission.ViewReferralComments)
                    ? referral.CloseReason
                    : null,
                Comments = contextPermissions.Contains(Permission.ViewReferralComments)
                    ? referral.Comments
                    : null,
                Arrangements = referral
                    .Arrangements.Select(arrangement =>
                        (
                            arrangement with
                            {
                                ChildLocationHistory = contextPermissions.Contains(
                                    Permission.ViewChildLocationHistory
                                )
                                    ? arrangement.ChildLocationHistory
                                    : ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                                Comments = contextPermissions.Contains(
                                    Permission.ViewReferralComments
                                )
                                    ? arrangement.Comments
                                    : null,
                                Reason = contextPermissions.Contains(
                                    Permission.ViewReferralComments
                                )
                                    ? arrangement.Reason
                                    : null,
                                CompletedRequirements = contextPermissions.Contains(
                                    Permission.ViewArrangementProgress
                                )
                                    ? arrangement.CompletedRequirements
                                    : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                                ExemptedRequirements = contextPermissions.Contains(
                                    Permission.ViewArrangementProgress
                                )
                                    ? arrangement.ExemptedRequirements
                                    : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                                MissingRequirements =
                                    contextPermissions.Contains(Permission.ViewArrangementProgress)
                                        ? arrangement.MissingRequirements
                                    : contextPermissions.Contains(
                                        Permission.ViewAssignedArrangementProgress
                                    )
                                    && userFamily != null
                                        ? arrangement
                                            .MissingRequirements.Where(m =>
                                                m.VolunteerFamilyId == userFamily.Id
                                            )
                                            .ToImmutableList()
                                    : ImmutableList<MissingArrangementRequirement>.Empty,
                                IndividualVolunteerAssignments = contextPermissions.Contains(
                                    Permission.ViewAssignments
                                )
                                    ? arrangement
                                        .IndividualVolunteerAssignments.Select(iva =>
                                            (
                                                iva with
                                                {
                                                    CompletedRequirements =
                                                        contextPermissions.Contains(
                                                            Permission.ViewArrangementProgress
                                                        )
                                                            ? iva.CompletedRequirements
                                                        : contextPermissions.Contains(
                                                            Permission.ViewAssignedArrangementProgress
                                                        )
                                                        && iva.FamilyId == userFamily?.Id
                                                            ? iva.CompletedRequirements
                                                        : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                                                    ExemptedRequirements =
                                                        contextPermissions.Contains(
                                                            Permission.ViewArrangementProgress
                                                        )
                                                            ? iva.ExemptedRequirements
                                                        : contextPermissions.Contains(
                                                            Permission.ViewAssignedArrangementProgress
                                                        )
                                                        && iva.FamilyId == userFamily?.Id
                                                            ? iva.ExemptedRequirements
                                                        : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                                                }
                                            )
                                        )
                                        .ToImmutableList()
                                    : ImmutableList<Resources.Referrals.IndividualVolunteerAssignment>.Empty,
                                FamilyVolunteerAssignments = contextPermissions.Contains(
                                    Permission.ViewAssignments
                                )
                                    ? arrangement
                                        .FamilyVolunteerAssignments.Select(fva =>
                                            (
                                                fva with
                                                {
                                                    CompletedRequirements =
                                                        contextPermissions.Contains(
                                                            Permission.ViewArrangementProgress
                                                        )
                                                            ? fva.CompletedRequirements
                                                        : contextPermissions.Contains(
                                                            Permission.ViewAssignedArrangementProgress
                                                        )
                                                        && fva.FamilyId == userFamily?.Id
                                                            ? fva.CompletedRequirements
                                                        : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                                                    ExemptedRequirements =
                                                        contextPermissions.Contains(
                                                            Permission.ViewArrangementProgress
                                                        )
                                                            ? fva.ExemptedRequirements
                                                        : contextPermissions.Contains(
                                                            Permission.ViewAssignedArrangementProgress
                                                        )
                                                        && fva.FamilyId == userFamily?.Id
                                                            ? fva.ExemptedRequirements
                                                        : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                                                }
                                            )
                                        )
                                        .ToImmutableList()
                                    : ImmutableList<Resources.Referrals.FamilyVolunteerAssignment>.Empty,
                            }
                        )
                    )
                    .ToImmutableList(),
            };
        }

        internal static VolunteerFamilyInfo DiscloseVolunteerFamilyInfo(
            VolunteerFamilyInfo volunteerFamilyInfo,
            ImmutableList<Permission> contextPermissions
        )
        {
            return volunteerFamilyInfo with
            {
                FamilyRoleApprovals = contextPermissions.Contains(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.FamilyRoleApprovals
                    : ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty,
                RoleRemovals = contextPermissions.Contains(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.RoleRemovals
                    : ImmutableList<RoleRemoval>.Empty,
                IndividualVolunteers =
                    volunteerFamilyInfo.IndividualVolunteers.ToImmutableDictionary(
                        keySelector: kvp => kvp.Key,
                        elementSelector: kvp =>
                            (
                                kvp.Value with
                                {
                                    RoleRemovals = contextPermissions.Contains(
                                        Permission.ViewApprovalStatus
                                    )
                                        ? kvp.Value.RoleRemovals
                                        : ImmutableList<RoleRemoval>.Empty,
                                    ApprovalStatusByRole = contextPermissions.Contains(
                                        Permission.ViewApprovalStatus
                                    )
                                        ? kvp.Value.ApprovalStatusByRole
                                        : ImmutableDictionary<
                                            string,
                                            IndividualRoleApprovalStatus
                                        >.Empty,
                                    CompletedRequirements = contextPermissions.Contains(
                                        Permission.ViewApprovalProgress
                                    )
                                        ? kvp.Value.CompletedRequirements
                                        : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                                    ExemptedRequirements = contextPermissions.Contains(
                                        Permission.ViewApprovalProgress
                                    )
                                        ? kvp.Value.ExemptedRequirements
                                        : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                                }
                            )
                    ),
                CompletedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.CompletedRequirements
                    : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ExemptedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.ExemptedRequirements
                    : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                History = contextPermissions.Contains(Permission.ViewApprovalHistory)
                    ? volunteerFamilyInfo.History
                    : ImmutableList<Activity>.Empty,
            };
        }

        internal static Family DiscloseFamily(
            Family family,
            ImmutableList<Permission> contextPermissions
        )
        {
            return family with
            {
                Adults = family
                    .Adults.Select(adult =>
                        (DisclosePerson(adult.Item1, contextPermissions), adult.Item2)
                    )
                    .ToImmutableList(),
                Children = family
                    .Children.Select(child => DisclosePerson(child, contextPermissions))
                    .ToImmutableList(),
                DeletedDocuments = contextPermissions.Contains(
                    Permission.ViewFamilyDocumentMetadata
                )
                    ? family.DeletedDocuments
                    : ImmutableList<Guid>.Empty,
                UploadedDocuments = contextPermissions.Contains(
                    Permission.ViewFamilyDocumentMetadata
                )
                    ? family.UploadedDocuments
                    : ImmutableList<UploadedDocumentInfo>.Empty,
                CompletedCustomFields = contextPermissions.Contains(
                    Permission.ViewFamilyCustomFields
                )
                    ? family.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                History = contextPermissions.Contains(Permission.ViewFamilyHistory)
                    ? family.History
                    : ImmutableList<Activity>.Empty,
            };
        }

        internal static Person DisclosePerson(
            Person person,
            ImmutableList<Permission> contextPermissions
        ) =>
            person with
            {
                Concerns = contextPermissions.Contains(Permission.ViewPersonConcerns)
                    ? person.Concerns
                    : null,
                Notes = contextPermissions.Contains(Permission.ViewPersonNotes)
                    ? person.Notes
                    : null,
                Addresses = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.Addresses
                    : ImmutableList<Address>.Empty,
                CurrentAddressId = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.CurrentAddressId
                    : null,
                EmailAddresses = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.EmailAddresses
                    : ImmutableList<EmailAddress>.Empty,
                PreferredEmailAddressId = contextPermissions.Contains(
                    Permission.ViewPersonContactInfo
                )
                    ? person.PreferredEmailAddressId
                    : null,
                PhoneNumbers = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.PhoneNumbers
                    : ImmutableList<PhoneNumber>.Empty,
                PreferredPhoneNumberId = contextPermissions.Contains(
                    Permission.ViewPersonContactInfo
                )
                    ? person.PreferredPhoneNumberId
                    : null,
                Age =
                    person.Age != null
                        ? contextPermissions.Contains(Permission.ViewPersonDateOfBirth)
                            ? person.Age
                            : person.Age is ExactAge exactAge
                                ? new AgeInYears(
                                    DateTime.UtcNow.Year - exactAge.DateOfBirth.Year,
                                    DateTime.UtcNow
                                )
                                : person.Age
                        : null,
            };

        internal async Task<bool> DiscloseNoteAsync(
            Note note,
            Guid organizationId,
            Guid locationId,
            Guid? userPersonId,
            ImmutableList<Permission> contextPermissions
        )
        {
            var authorAccount = await accountsResource.TryGetUserAccountAsync(note.AuthorId);
            //NOTE: The 'SingleOrDefault' logic here is used to make it possible to copy an organization's
            //      data over to a test/demo tenant that does not have the same user accounts defined.
            var authorPersonId = authorAccount
                ?.Organizations.SingleOrDefault(org => org.OrganizationId == organizationId)
                ?.Locations.SingleOrDefault(loc => loc.LocationId == locationId)
                ?.PersonId;

            // Disclose the note if:
            //  1. the current user is the same person as the author, or
            //  2. the user has permission to view all notes.
            return (userPersonId != null && authorPersonId == userPersonId)
                || contextPermissions.Contains(Permission.ViewAllNotes);
        }
    }
}
