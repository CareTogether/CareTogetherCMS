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
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1Referrals;
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
            SessionUserContext userContext,
            FamilyCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
                    UpdateTestFamilyFlag => Permission.EditFamilyInfo,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            Guid familyId,
            PersonCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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

        public async Task<bool> AuthorizeV1CaseCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            V1CaseCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new FamilyAuthorizationContext(command.FamilyId)
            );
            return permissions.Contains(
                command switch
                {
                    CreateReferral => Permission.CreateV1Case,
                    CompleteReferralRequirement => Permission.EditV1CaseRequirementCompletion,
                    MarkReferralRequirementIncomplete => Permission.EditV1CaseRequirementCompletion,
                    ExemptReferralRequirement => Permission.EditV1CaseRequirementExemption,
                    UnexemptReferralRequirement => Permission.EditV1CaseRequirementExemption,
                    UpdateCustomReferralField => Permission.EditV1Case,
                    UpdateReferralComments => Permission.EditV1Case,
                    CloseReferral => Permission.CloseV1Case,
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                }
            );
        }

        public async Task<bool> AuthorizeArrangementsCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            ArrangementsCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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

        public async Task<bool> AuthorizeV1ReferralCommandAsync(
    Guid organizationId,
    Guid locationId,
    SessionUserContext userContext,
    V1ReferralCommand command
)
{


    var permissions = command switch
    {
        CreateV1Referral => await userAccessCalculation.AuthorizeUserAccessAsync(
            organizationId,
            locationId,
            userContext,
            new GlobalAuthorizationContext()
        ),

        UpdateV1ReferralFamily c => await userAccessCalculation.AuthorizeUserAccessAsync(
            organizationId,
            locationId,
            userContext,
            new FamilyAuthorizationContext(c.FamilyId)
        ),

        CloseV1Referral c => await userAccessCalculation.AuthorizeUserAccessAsync(
            organizationId,
            locationId,
            userContext,
            new GlobalAuthorizationContext()
        ),

        ReopenV1Referral => await userAccessCalculation.AuthorizeUserAccessAsync(
            organizationId,
            locationId,
            userContext,
            new GlobalAuthorizationContext()
        ),

        _ => throw new NotImplementedException(
            $"The command type '{command.GetType().FullName}' has not been implemented."
        ),
    };

    return permissions.Contains(
        command switch
        {
            CreateV1Referral => Permission.CreateV1Referral,
            UpdateV1ReferralFamily => Permission.EditV1Referral,
            CloseV1Referral => Permission.CloseV1Referral,
            ReopenV1Referral => Permission.ReopenV1Referral,
            _ => throw new NotImplementedException(
                $"The command type '{command.GetType().FullName}' has not been implemented."
            ),
        }
    );
}

public async Task<bool> AuthorizeV1ReferralReadAsync(
    Guid organizationId,
    Guid locationId,
    SessionUserContext userContext
)
{
    var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
        organizationId,
        locationId,
        userContext,
        new GlobalAuthorizationContext()
    );

    return permissions.Contains(Permission.ViewV1Referral);
}



        public async Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            NoteCommand command
        )
        {
            var userPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new FamilyAuthorizationContext(command.FamilyId)
            );

            var noteEntry = await GetNoteEntryAsync(
                organizationId,
                locationId,
                command.FamilyId,
                command.NoteId
            );

            var noteBelongsToUser = noteEntry?.AuthorId == userContext.User.UserId();

            var allowedPerAccessLevel = await CheckAccessLevel(
                noteEntry?.AccessLevel,
                userContext.User,
                organizationId,
                locationId
            );

            var hasPermission = command switch
            {
                CreateDraftNote => CheckCreateDraftNotePermission(
                    noteEntry,
                    noteBelongsToUser,
                    userPermissions,
                    allowedPerAccessLevel
                ),
                EditDraftNote => CheckEditDraftNotePermission(
                    noteEntry,
                    noteBelongsToUser,
                    userPermissions,
                    allowedPerAccessLevel
                ),
                DiscardDraftNote => CheckDiscardDraftNotePermission(
                    noteEntry,
                    noteBelongsToUser,
                    userPermissions,
                    allowedPerAccessLevel
                ),
                ApproveNote => CheckApproveNotePermission(
                    noteEntry,
                    noteBelongsToUser,
                    userPermissions,
                    allowedPerAccessLevel
                ),
                UpdateNoteAccessLevel => CheckUpdateNoteAccessLevelPermission(
                    noteEntry,
                    noteBelongsToUser,
                    userPermissions,
                    allowedPerAccessLevel
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

            if (!hasPermission.Item1)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"Note command validation failed: {hasPermission.Item2}"
                );
                return false;
            }

            return true;
        }

        private (bool, string) CheckIfNoteExists(NoteEntry? noteEntry)
        {
            if (noteEntry == null)
            {
                return (false, "Note does not exist.");
            }

            return (true, string.Empty);
        }

        private (bool, string) CheckCreateDraftNotePermission(
            NoteEntry? noteEntry,
            bool noteBelongsToUser,
            ImmutableList<Permission> userPermissions,
            bool allowedPerAccessLevel
        )
        {
            if (noteEntry != null)
            {
                return (
                    false,
                    "Cannot create a draft note when a note with the same ID already exists."
                );
            }

            var hasPermission =
                userPermissions.Contains(Permission.AddEditDraftNotes)
                || userPermissions.Contains(Permission.AddEditOwnDraftNotes);

            if (!hasPermission)
            {
                return (false, "User does not have permission to create draft notes.");
            }

            return (true, string.Empty);
        }

        private (bool, string) CheckEditDraftNotePermission(
            NoteEntry? noteEntry,
            bool noteBelongsToUser,
            ImmutableList<Permission> userPermissions,
            bool allowedPerAccessLevel
        )
        {
            var noteExists = CheckIfNoteExists(noteEntry);
            if (!noteExists.Item1)
            {
                return noteExists;
            }

            if (noteEntry?.Status != NoteStatus.Draft)
            {
                return (false, "Cannot edit a note that is not in Draft status.");
            }

            var hasPermission =
                (userPermissions.Contains(Permission.AddEditDraftNotes) && allowedPerAccessLevel)
                || (userPermissions.Contains(Permission.AddEditOwnDraftNotes) && noteBelongsToUser);

            if (!hasPermission)
            {
                return (false, "User does not have permission to edit notes.");
            }

            return (true, string.Empty);
        }

        private (bool, string) CheckDiscardDraftNotePermission(
            NoteEntry? noteEntry,
            bool noteBelongsToUser,
            ImmutableList<Permission> userPermissions,
            bool allowedPerAccessLevel
        )
        {
            var noteExists = CheckIfNoteExists(noteEntry);
            if (!noteExists.Item1)
            {
                return noteExists;
            }

            if (noteEntry?.Status != NoteStatus.Draft)
            {
                return (false, "Cannot discard a note that is not in Draft status.");
            }

            var hasPermission =
                (userPermissions.Contains(Permission.DiscardDraftNotes) && allowedPerAccessLevel)
                || (userPermissions.Contains(Permission.DiscardOwnDraftNotes) && noteBelongsToUser);

            if (!hasPermission)
            {
                return (false, "User does not have permission to discard notes.");
            }

            return (true, string.Empty);
        }

        private (bool, string) CheckApproveNotePermission(
            NoteEntry? noteEntry,
            bool noteBelongsToUser,
            ImmutableList<Permission> userPermissions,
            bool allowedPerAccessLevel
        )
        {
            var noteExists = CheckIfNoteExists(noteEntry);
            if (!noteExists.Item1)
            {
                return noteExists;
            }

            if (noteEntry?.Status != NoteStatus.Draft)
            {
                return (false, "Cannot approve a note that is not in Draft status.");
            }

            var hasPermission = userPermissions.Contains(Permission.ApproveNotes);

            if (!hasPermission)
            {
                return (false, "User does not have permission to approve notes.");
            }

            return (true, string.Empty);
        }

        private (bool, string) CheckUpdateNoteAccessLevelPermission(
            NoteEntry? noteEntry,
            bool noteBelongsToUser,
            ImmutableList<Permission> userPermissions,
            bool allowedPerAccessLevel
        )
        {
            var noteExists = CheckIfNoteExists(noteEntry);
            if (!noteExists.Item1)
            {
                return noteExists;
            }

            if (noteEntry?.Status != NoteStatus.Approved)
            {
                return (false, "Cannot update the access level of a note that is not Approved.");
            }

            var hasPermission = (
                userPermissions.Contains(Permission.UpdateOthersNoteAccessLevel)
                || (userPermissions.Contains(Permission.AddEditOwnDraftNotes) && noteBelongsToUser)
            );

            if (!hasPermission)
            {
                return (false, "User does not have permission to update the note access level.");
            }

            return (true, string.Empty);
        }

        private async Task<NoteEntry?> GetNoteEntryAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid noteId
        )
        {
            var familyNotes = await notesResource.ListFamilyNotesAsync(
                organizationId,
                locationId,
                familyId
            );

            return familyNotes.FirstOrDefault(note => note.Id == noteId);
        }

        private async Task<bool> CheckAccessLevel(
            string? accessLevel,
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        )
        {
            if (accessLevel == null)
            {
                // If the note does not have an access level set, we assume it is allowed for 'Everyone'
                return true; // No access level set, so everyone can access.
            }

            var config = await policiesResource.GetConfigurationAsync(organizationId);
            var location = config.Locations.FirstOrDefault(location => location.Id == locationId);
            var accessLevelDefinition = location?.AccessLevels?.FirstOrDefault(al =>
                al.Name == accessLevel
            );

            if (
                accessLevelDefinition != null
                && !UserHasAnyRole(user, accessLevelDefinition.OrganizationRoles)
            )
            {
                return false;
            }

            return true;
        }

        // Helper to check if user has any of the required roles
        private static bool UserHasAnyRole(ClaimsPrincipal user, string[] requiredRoles)
        {
            if (requiredRoles == null || requiredRoles.Length == 0)
                return true; // No restriction
            return user.Claims.Any(c =>
                c.Type == System.Security.Claims.ClaimTypes.Role && requiredRoles.Contains(c.Value)
            );
        }

        public async Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new AllVolunteerFamiliesAuthorizationContext()
            ); //TODO: This could simplify down to 'Global'
            return permissions.Contains(Permission.SendBulkSms);
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            VolunteerFamilyCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
            SessionUserContext userContext,
            VolunteerCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
            SessionUserContext userContext,
            CommunityCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
            SessionUserContext userContext,
            PersonAccessCommand command
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
            SessionUserContext userContext
        )
        {
            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new GlobalAuthorizationContext()
            );
            return permissions.Contains(Permission.InvitePersonUser);
        }

        public async Task<CombinedFamilyInfo> DiscloseFamilyAsync(
            SessionUserContext userContext,
            Guid organizationId,
            Guid locationId,
            CombinedFamilyInfo family
        )
        {
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new FamilyAuthorizationContext(family.Family.Id, family.Family)
            );

            return family with
            {
                PartneringFamilyInfo =
                family.PartneringFamilyInfo == null
                    ? null
                    : DisclosePartneringFamilyInfo(
                        family.PartneringFamilyInfo,
                        userContext.UserFamily,
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
                                userContext.User.PersonId(organizationId, locationId),
                                contextPermissions,
                                userContext.User
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
            SessionUserContext userContext,
            Guid organizationId,
            Guid locationId,
            CommunityInfo community
        )
        {
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
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
                OpenV1Case =
                    partneringFamilyInfo.OpenV1Case != null
                        ? DiscloseV1Case(
                            partneringFamilyInfo.OpenV1Case,
                            userFamily,
                            contextPermissions
                        )
                        : null,
                ClosedV1Cases = partneringFamilyInfo
                    .ClosedV1Cases.Select(closedV1Case =>
                        DiscloseV1Case(closedV1Case, userFamily, contextPermissions)
                    )
                    .ToImmutableList(),
                History = contextPermissions.Contains(Permission.ViewV1CaseHistory)
                    ? partneringFamilyInfo.History
                    : ImmutableList<Activity>.Empty,
            };
        }

        internal V1Case DiscloseV1Case(
            V1Case v1Case,
            Family? userFamily,
            ImmutableList<Permission> contextPermissions
        )
        {
            return v1Case with
            {
                CompletedCustomFields = contextPermissions.Contains(
                    Permission.ViewV1CaseCustomFields
                )
                    ? v1Case.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                MissingCustomFields = contextPermissions.Contains(Permission.ViewV1CaseCustomFields)
                    ? v1Case.MissingCustomFields
                    : ImmutableList<string>.Empty,
                CompletedRequirements = contextPermissions.Contains(Permission.ViewV1CaseProgress)
                    ? v1Case.CompletedRequirements
                    : ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ExemptedRequirements = contextPermissions.Contains(Permission.ViewV1CaseProgress)
                    ? v1Case.ExemptedRequirements
                    : ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                MissingRequirements = contextPermissions.Contains(Permission.ViewV1CaseProgress)
                    ? v1Case.MissingRequirements
                    : ImmutableList<RequirementDefinition>.Empty,
                CloseReason = contextPermissions.Contains(Permission.ViewV1CaseComments)
                    ? v1Case.CloseReason
                    : null,
                Comments = contextPermissions.Contains(Permission.ViewV1CaseComments)
                    ? v1Case.Comments
                    : null,
                Arrangements = v1Case
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
                                    Permission.ViewV1CaseComments
                                )
                                    ? arrangement.Comments
                                    : null,
                                Reason = contextPermissions.Contains(Permission.ViewV1CaseComments)
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
                                    : ImmutableList<Resources.V1Cases.IndividualVolunteerAssignment>.Empty,
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
                                    : ImmutableList<Resources.V1Cases.FamilyVolunteerAssignment>.Empty,
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
            ImmutableList<Permission> contextPermissions,
            ClaimsPrincipal user
        )
        {
            var authorAccount = await accountsResource.TryGetUserAccountAsync(note.AuthorId);
            var authorPersonId = authorAccount
                ?.Organizations.SingleOrDefault(org => org.OrganizationId == organizationId)
                ?.Locations.SingleOrDefault(loc => loc.LocationId == locationId)
                ?.PersonId;

            // If the user is the author, allow
            if (userPersonId != null && authorPersonId == userPersonId)
                return true;

            // If the user has view all notes permission and note's AccessLevel is
            // set to null (null means Everyone), allow
            if (
                contextPermissions.Contains(Permission.ViewAllNotes)
                && string.IsNullOrEmpty(note.AccessLevel)
            )
                return true;

            // Enforce access level if set
            var config = await policiesResource.GetConfigurationAsync(organizationId);
            var location = config.Locations.FirstOrDefault(l => l.Id == locationId);
            var accessLevel = location?.AccessLevels?.FirstOrDefault(al =>
                al.Name == note.AccessLevel
            );
            var userLocalIdentity = user.LocationIdentity(organizationId, locationId);
            if (
                accessLevel != null
                && userLocalIdentity != null
                && accessLevel.OrganizationRoles.Any(roleName =>
                    user.HasClaim(userLocalIdentity.RoleClaimType, roleName)
                )
            )
                return true;

            return false;
        }
    }
}
