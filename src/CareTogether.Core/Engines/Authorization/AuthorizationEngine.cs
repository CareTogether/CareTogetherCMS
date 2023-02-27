using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
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
        private readonly IApprovalsResource approvalsResource;


        public AuthorizationEngine(IPoliciesResource policiesResource,
            IDirectoryResource directoryResource, IReferralsResource referralsResource,
            IApprovalsResource approvalsResource)
        {
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.referralsResource = referralsResource;
            this.approvalsResource = approvalsResource;
        }


        public async Task<ImmutableList<Permission>> AuthorizeUserAccessAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, AuthorizationContext context)
        {
            // If the caller is using an API key, give full access.
            if (user.Identity?.AuthenticationType == "API Key" &&
                user.HasClaim(Claims.OrganizationId, organizationId.ToString()))
                return Enum.GetValues<Permission>().ToImmutableList();

            // The user must have access to this organization and location.
            var userLocalIdentity = user.LocationIdentity(organizationId, locationId);
            if (userLocalIdentity == null)
                return ImmutableList<Permission>.Empty;

            // Look up the user's family, which will be referenced several times.
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily = userPersonId == null ? null :
                await directoryResource.FindPersonFamilyAsync(organizationId, locationId, userPersonId.Value);

            // If in a family authorization context, look up the target family, which will be referenced several times.
            var familyId = (context as FamilyAuthorizationContext)?.FamilyId;
            var targetFamily = familyId.HasValue
                ? await directoryResource.FindFamilyAsync(organizationId, locationId, familyId.Value) : null;
            var targetFamilyVolunteerInfo = familyId.HasValue
                ? await approvalsResource.TryGetVolunteerFamilyAsync(organizationId, locationId, familyId.Value) : null;
            //TODO: This could be optimized to find only the user family's referrals or the target family's referrals.
            var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);
            var userFamilyReferrals = referrals.Where(referral => referral.FamilyId == userFamily?.Id).ToImmutableList();
            var targetFamilyReferrals = referrals.Where(referral => referral.FamilyId == targetFamily?.Id).ToImmutableList();
            var assignedReferrals = referrals.Where(referral => referral.Arrangements.Any(arrangement =>
                arrangement.Value.FamilyVolunteerAssignments.Exists(assignment => assignment.FamilyId == userFamily?.Id) ||
                arrangement.Value.IndividualVolunteerAssignments.Exists(assignment => assignment.FamilyId == userFamily?.Id)))
                .ToImmutableList();

            // We need to evaluate each of the user's roles to determine which permission sets
            // apply to the user's current context.
            var config = await policiesResource.GetConfigurationAsync(organizationId);
            var userPermissionSets = config.Roles
                .Where(role => userLocalIdentity.HasClaim(userLocalIdentity.RoleClaimType, role.RoleName))
                .SelectMany(role => role.PermissionSets)
                .ToImmutableList();
            var applicablePermissionSets = userPermissionSets
                .Where(permissionSet => IsPermissionSetApplicable(permissionSet,
                    context, userFamily, targetFamily, //TODO: Need to include target community & families' community memberships!
                    targetFamilyVolunteerInfo, userFamilyReferrals,
                    targetFamilyReferrals, assignedReferrals))
                .ToImmutableList();

            return applicablePermissionSets
                .SelectMany(permissionSet => permissionSet.Permissions)
                .Distinct()
                .ToImmutableList();
        }

        internal static bool IsPermissionSetApplicable(ContextualPermissionSet permissionSet,
            AuthorizationContext context, Family? userFamily, Family? targetFamily,
            VolunteerFamilyEntry? targetFamilyVolunteerInfo, ImmutableList<ReferralEntry> userFamilyReferrals,
            ImmutableList<ReferralEntry> targetFamilyReferrals, ImmutableList<ReferralEntry> assignedReferrals)
        {
            return permissionSet.Context switch
            {
                GlobalPermissionContext c => true,
                OwnFamilyPermissionContext c =>
                    context is FamilyAuthorizationContext &&
                    userFamily != null && userFamily.Id == targetFamily?.Id,
                AllVolunteerFamiliesPermissionContext c => context switch
                {
                    FamilyAuthorizationContext or AllVolunteerFamiliesAuthorizationContext =>
                        targetFamily != null && targetFamilyVolunteerInfo != null,
                    _ => false
                },
                AllPartneringFamiliesPermissionContext c => context switch
                {
                    FamilyAuthorizationContext or AllPartneringFamiliesAuthorizationContext =>
                        targetFamily != null && !targetFamilyReferrals.IsEmpty,
                    _ => false
                },
                //TODO: Should the following be restricted so only the assigned individual, or in the case of a family assignment,
                //      only the participating individuals, can access the partnering family?
                AssignedFunctionsInReferralPartneringFamilyPermissionContext c =>
                    context is FamilyAuthorizationContext &&
                    targetFamily != null && targetFamilyReferrals.Any(referral => //TODO: The individual logic blocks here can be extracted to helper methods.
                        (c.WhenReferralIsOpen == null || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)) &&
                        referral.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == userFamily?.Id &&
                                (c.WhenOwnFunctionIsIn == null || c.WhenOwnFunctionIsIn.Contains(fva.ArrangementFunction))) ||
                            arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == userFamily?.Id &&
                                (c.WhenOwnFunctionIsIn == null || c.WhenOwnFunctionIsIn.Contains(iva.ArrangementFunction))))),
                OwnReferralAssigneeFamiliesPermissionContext c =>
                    context is FamilyAuthorizationContext &&
                    targetFamily != null && userFamilyReferrals.Any(referral =>
                        (c.WhenReferralIsOpen == null || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)) &&
                        referral.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == targetFamily.Id &&
                                (c.WhenAssigneeFunctionIsIn == null || c.WhenAssigneeFunctionIsIn.Contains(fva.ArrangementFunction))) ||
                            arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == targetFamily.Id &&
                                (c.WhenAssigneeFunctionIsIn == null || c.WhenAssigneeFunctionIsIn.Contains(iva.ArrangementFunction))))),
                AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext c =>
                    context is FamilyAuthorizationContext &&
                    targetFamily != null && assignedReferrals.Any(referral =>
                        (c.WhenReferralIsOpen == null || c.WhenReferralIsOpen == (referral.ClosedAtUtc == null)) &&
                        referral.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == userFamily?.Id &&
                                (c.WhenOwnFunctionIsIn == null || c.WhenOwnFunctionIsIn.Contains(fva.ArrangementFunction))) ||
                            arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == userFamily?.Id &&
                                (c.WhenOwnFunctionIsIn == null || c.WhenOwnFunctionIsIn.Contains(iva.ArrangementFunction)))) &&
                        referral.Arrangements.Any(arrangement =>
                            arrangement.Value.FamilyVolunteerAssignments.Any(fva =>
                                fva.FamilyId == targetFamily.Id &&
                                (c.WhenAssigneeFunctionIsIn == null || c.WhenAssigneeFunctionIsIn.Contains(fva.ArrangementFunction))) ||
                            arrangement.Value.IndividualVolunteerAssignments.Any(iva =>
                                iva.FamilyId == targetFamily.Id &&
                                (c.WhenAssigneeFunctionIsIn == null || c.WhenAssigneeFunctionIsIn.Contains(iva.ArrangementFunction))))),
                CommunityMemberPermissionContext c =>
                    context is CommunityAuthorizationContext, //TODO: also look at FamilyAuthorizationContext (for community members)
                    //userFamily.CommunityMemberships.Any(communityId => communityId == context.CommunityId),
                CommunityCoMemberFamiliesPermissionContext c =>
                    context is FamilyAuthorizationContext, //TODO: also look at FamilyAuthorizationContext (for community members)
                    //TODO: userFamily.CommunityMemberships.Any(communityId => communityId == context.CommunityId),
                _ => throw new NotImplementedException(
                    $"The permission context type '{permissionSet.Context.GetType().FullName}' has not been implemented.")
            };
        }

        public async Task<bool> AuthorizeFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, FamilyCommand command)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
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
                UpdateCustomFamilyField => Permission.EditFamilyInfo,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public async Task<bool> AuthorizePersonCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, Guid familyId, PersonCommand command)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(familyId));
            return permissions.Contains(command switch
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
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
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
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
            {
                CreateArrangement => Permission.CreateArrangement,
                AssignIndividualVolunteer => Permission.EditAssignments,
                AssignVolunteerFamily => Permission.EditAssignments,
                UnassignIndividualVolunteer => Permission.EditAssignments,
                UnassignVolunteerFamily => Permission.EditAssignments,
                PlanArrangementStart => Permission.EditArrangement,
                StartArrangements => Permission.EditArrangement,
                EditArrangementStartTime => Permission.EditArrangement,
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
                PlanChildLocationChange => Permission.TrackChildLocationChange,
                DeletePlannedChildLocationChange => Permission.TrackChildLocationChange,
                TrackChildLocationChange => Permission.TrackChildLocationChange,
                DeleteChildLocationChange => Permission.TrackChildLocationChange,
                PlanArrangementEnd => Permission.EditArrangement,
                EndArrangements => Permission.EditArrangement,
                ReopenArrangements => Permission.EditArrangement,
                CancelArrangementsSetup => Permission.EditArrangement,
                UpdateArrangementComments => Permission.EditArrangement,
                DeleteArrangements => Permission.DeleteArrangement,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public async Task<bool> AuthorizeNoteCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, NoteCommand command)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
            {
                CreateDraftNote => Permission.AddEditDraftNotes,
                EditDraftNote => Permission.AddEditDraftNotes,
                DiscardDraftNote => Permission.DiscardDraftNotes,
                ApproveNote => Permission.ApproveNotes,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public async Task<bool> AuthorizeSendSmsAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new AllVolunteerFamiliesAuthorizationContext()); //TODO: This could simplify down to 'Global'
            return permissions.Contains(Permission.SendBulkSms);
        }

        public async Task<bool> AuthorizeVolunteerFamilyCommandAsync(
            Guid organizationId, Guid locationId, ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
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
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(command.FamilyId));
            return permissions.Contains(command switch
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

        public async Task<bool> AuthorizeCommunityCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, CommunityCommand command)
        {
            var permissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new CommunityAuthorizationContext(command.CommunityId));
            return permissions.Contains(command switch
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
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            });
        }

        public async Task<CombinedFamilyInfo> DiscloseFamilyAsync(ClaimsPrincipal user,
            Guid organizationId, Guid locationId, CombinedFamilyInfo family)
        {
            var userPersonId = user.PersonId(organizationId, locationId);
            var userFamily = userPersonId == null ? null
                : await directoryResource.FindPersonFamilyAsync(organizationId, locationId, userPersonId.Value);

            var contextPermissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new FamilyAuthorizationContext(family.Family.Id));

            return family with
            {
                PartneringFamilyInfo = family.PartneringFamilyInfo == null
                    ? null : DisclosePartneringFamilyInfo(family.PartneringFamilyInfo, userFamily, contextPermissions),
                VolunteerFamilyInfo = family.VolunteerFamilyInfo == null
                    ? null : DiscloseVolunteerFamilyInfo(family.VolunteerFamilyInfo, contextPermissions),
                Family = DiscloseFamily(family.Family, contextPermissions),
                Notes = (await family.Notes
                    .Select(async note => (note, canDisclose: await DiscloseNoteAsync(note,
                        organizationId, locationId, userPersonId, contextPermissions)))
                    .WhenAll())
                    .Where(x => x.canDisclose)
                    .Select(x => x.note)
                    .ToImmutableList(),
                UploadedDocuments = family.UploadedDocuments, //TODO: Disclosure logic is needed here as well,
                MissingCustomFields = contextPermissions.Contains(Permission.ViewFamilyCustomFields)
                    ? family.MissingCustomFields : ImmutableList<string>.Empty,
                UserPermissions = contextPermissions
            };
        }

        public async Task<Community> DiscloseCommunityAsync(ClaimsPrincipal user,
            Guid organizationId, Guid locationId, Community community)
        {
            var contextPermissions = await AuthorizeUserAccessAsync(organizationId, locationId, user,
                new CommunityAuthorizationContext(community.Id));

            return community with
            {
                UploadedDocuments = contextPermissions.Contains(Permission.ViewCommunityDocumentMetadata)
                    ? community.UploadedDocuments : ImmutableList<UploadedDocumentInfo>.Empty,
            };
        }

        internal PartneringFamilyInfo DisclosePartneringFamilyInfo(PartneringFamilyInfo partneringFamilyInfo,
            Family? userFamily, ImmutableList<Permission> contextPermissions)
        {
            return partneringFamilyInfo with
            {
                OpenReferral = partneringFamilyInfo.OpenReferral != null
                    ? DiscloseReferral(partneringFamilyInfo.OpenReferral, userFamily, contextPermissions)
                    : null,
                ClosedReferrals = partneringFamilyInfo.ClosedReferrals
                    .Select(closedReferral => DiscloseReferral(closedReferral, userFamily, contextPermissions))
                    .ToImmutableList(),
                History = contextPermissions.Contains(Permission.ViewReferralHistory)
                    ? partneringFamilyInfo.History
                    : ImmutableList<Activity>.Empty
            };
        }


        internal Referral DiscloseReferral(Referral referral,
            Family? userFamily, ImmutableList<Permission> contextPermissions)
        {
            return referral with
            {
                CompletedCustomFields = contextPermissions.Contains(Permission.ViewReferralCustomFields)
                    ? referral.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                MissingCustomFields = contextPermissions.Contains(Permission.ViewReferralCustomFields)
                    ? referral.MissingCustomFields
                    : ImmutableList<string>.Empty,
                CompletedRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.CompletedRequirements
                    : ImmutableList<CompletedRequirementInfo>.Empty,
                ExemptedRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.ExemptedRequirements
                    : ImmutableList<ExemptedRequirementInfo>.Empty,
                MissingRequirements = contextPermissions.Contains(Permission.ViewReferralProgress)
                    ? referral.MissingRequirements
                    : ImmutableList<string>.Empty,
                CloseReason = contextPermissions.Contains(Permission.ViewReferralComments)
                    ? referral.CloseReason
                    : null,
                Comments = contextPermissions.Contains(Permission.ViewReferralComments)
                    ? referral.Comments
                    : null,
                Arrangements = referral.Arrangements
                    .Select(arrangement =>
                        arrangement with
                        {
                            ChildLocationHistory = contextPermissions.Contains(Permission.ViewChildLocationHistory)
                                ? arrangement.ChildLocationHistory
                                : ImmutableSortedSet<ChildLocationHistoryEntry>.Empty,
                            Comments = contextPermissions.Contains(Permission.ViewReferralComments)
                                ? arrangement.Comments
                                : null,
                            CompletedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                ? arrangement.CompletedRequirements
                                : ImmutableList<CompletedRequirementInfo>.Empty,
                            ExemptedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                ? arrangement.ExemptedRequirements
                                : ImmutableList<ExemptedRequirementInfo>.Empty,
                            MissingRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                ? arrangement.MissingRequirements
                                : contextPermissions.Contains(Permission.ViewAssignedArrangementProgress)
                                    && userFamily != null
                                ? arrangement.MissingRequirements
                                    .Where(m => m.VolunteerFamilyId == userFamily.Id)
                                    .ToImmutableList()
                                : ImmutableList<MissingArrangementRequirement>.Empty,
                            IndividualVolunteerAssignments = contextPermissions.Contains(Permission.ViewAssignments)
                                ? arrangement.IndividualVolunteerAssignments
                                    .Select(iva => iva with
                                    {
                                        CompletedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                            ? iva.CompletedRequirements
                                            : contextPermissions.Contains(Permission.ViewAssignedArrangementProgress)
                                                && iva.FamilyId == userFamily?.Id
                                            ? iva.CompletedRequirements
                                            : ImmutableList<CompletedRequirementInfo>.Empty,
                                        ExemptedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                            ? iva.ExemptedRequirements
                                            : contextPermissions.Contains(Permission.ViewAssignedArrangementProgress)
                                                && iva.FamilyId == userFamily?.Id
                                            ? iva.ExemptedRequirements
                                            : ImmutableList<ExemptedRequirementInfo>.Empty
                                    }).ToImmutableList()
                                : ImmutableList<IndividualVolunteerAssignment>.Empty,
                            FamilyVolunteerAssignments = contextPermissions.Contains(Permission.ViewAssignments)
                                ? arrangement.FamilyVolunteerAssignments
                                    .Select(fva => fva with
                                    {
                                        CompletedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                            ? fva.CompletedRequirements
                                            : contextPermissions.Contains(Permission.ViewAssignedArrangementProgress)
                                                && fva.FamilyId == userFamily?.Id
                                            ? fva.CompletedRequirements
                                            : ImmutableList<CompletedRequirementInfo>.Empty,
                                        ExemptedRequirements = contextPermissions.Contains(Permission.ViewArrangementProgress)
                                            ? fva.ExemptedRequirements
                                            : contextPermissions.Contains(Permission.ViewAssignedArrangementProgress)
                                                && fva.FamilyId == userFamily?.Id
                                            ? fva.ExemptedRequirements
                                            : ImmutableList<ExemptedRequirementInfo>.Empty
                                    }).ToImmutableList()
                                : ImmutableList<FamilyVolunteerAssignment>.Empty
                        })
                    .ToImmutableList()
            };
        }

        internal static VolunteerFamilyInfo DiscloseVolunteerFamilyInfo(
            VolunteerFamilyInfo volunteerFamilyInfo, ImmutableList<Permission> contextPermissions)
        {
            return volunteerFamilyInfo with
            {
                FamilyRoleApprovals = contextPermissions.Contains(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.FamilyRoleApprovals
                    : ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                RemovedRoles = contextPermissions.Contains(Permission.ViewApprovalStatus)
                    ? volunteerFamilyInfo.RemovedRoles
                    : ImmutableList<RemovedRole>.Empty,
                IndividualVolunteers = volunteerFamilyInfo.IndividualVolunteers.ToImmutableDictionary(
                    keySelector: kvp => kvp.Key,
                    elementSelector: kvp => kvp.Value with
                    {
                        RemovedRoles = contextPermissions.Contains(Permission.ViewApprovalStatus)
                            ? kvp.Value.RemovedRoles
                            : ImmutableList<RemovedRole>.Empty,
                        IndividualRoleApprovals = contextPermissions.Contains(Permission.ViewApprovalStatus)
                            ? kvp.Value.IndividualRoleApprovals
                            : ImmutableDictionary<string, ImmutableList<RoleVersionApproval>>.Empty,
                        AvailableApplications = contextPermissions.Contains(Permission.ViewApprovalProgress)
                            ? kvp.Value.AvailableApplications
                            : ImmutableList<string>.Empty,
                        CompletedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                            ? kvp.Value.CompletedRequirements
                            : ImmutableList<CompletedRequirementInfo>.Empty,
                        ExemptedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                            ? kvp.Value.ExemptedRequirements
                            : ImmutableList<ExemptedRequirementInfo>.Empty,
                        MissingRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                            ? kvp.Value.MissingRequirements
                            : ImmutableList<string>.Empty,
                    }),
                AvailableApplications = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.AvailableApplications
                    : ImmutableList<string>.Empty,
                CompletedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.CompletedRequirements
                    : ImmutableList<CompletedRequirementInfo>.Empty,
                ExemptedRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.ExemptedRequirements
                    : ImmutableList<ExemptedRequirementInfo>.Empty,
                MissingRequirements = contextPermissions.Contains(Permission.ViewApprovalProgress)
                    ? volunteerFamilyInfo.MissingRequirements
                    : ImmutableList<string>.Empty,
                History = contextPermissions.Contains(Permission.ViewApprovalHistory)
                    ? volunteerFamilyInfo.History
                    : ImmutableList<Activity>.Empty
            };
        }

        internal static Family DiscloseFamily(Family family, ImmutableList<Permission> contextPermissions)
        {
            return family with
            {
                Adults = family.Adults
                    .Select(adult => (DisclosePerson(adult.Item1, contextPermissions), adult.Item2))
                    .ToImmutableList(),
                Children = family.Children
                    .Select(child => DisclosePerson(child, contextPermissions))
                    .ToImmutableList(),
                DeletedDocuments = contextPermissions.Contains(Permission.ViewFamilyDocumentMetadata)
                    ? family.DeletedDocuments
                    : ImmutableList<Guid>.Empty,
                UploadedDocuments = contextPermissions.Contains(Permission.ViewFamilyDocumentMetadata)
                    ? family.UploadedDocuments
                    : ImmutableList<UploadedDocumentInfo>.Empty,
                CompletedCustomFields = contextPermissions.Contains(Permission.ViewFamilyCustomFields)
                    ? family.CompletedCustomFields
                    : ImmutableList<CompletedCustomFieldInfo>.Empty,
                History = contextPermissions.Contains(Permission.ViewFamilyHistory)
                    ? family.History
                    : ImmutableList<Activity>.Empty
            };
        }

        internal static Person DisclosePerson(Person person, ImmutableList<Permission> contextPermissions) =>
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
                PreferredEmailAddressId = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.PreferredEmailAddressId
                    : null,
                PhoneNumbers = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.PhoneNumbers
                    : ImmutableList<PhoneNumber>.Empty,
                PreferredPhoneNumberId = contextPermissions.Contains(Permission.ViewPersonContactInfo)
                    ? person.PreferredPhoneNumberId
                    : null
            };

        internal async Task<bool> DiscloseNoteAsync(Note note, Guid organizationId, Guid locationId,
            Guid? userPersonId, ImmutableList<Permission> contextPermissions)
        {
            var author = await directoryResource.FindUserAsync(organizationId, locationId, note.AuthorId);
            return userPersonId != null && author?.Id == userPersonId.Value ||
                contextPermissions.Contains(Permission.ViewAllNotes);
        }
    }
}
