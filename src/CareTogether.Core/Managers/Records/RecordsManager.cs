using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1ReferralNotes;
using CareTogether.Resources.V1Referrals;
using Nito.AsyncEx;
using Nito.Disposables.Internals;

namespace CareTogether.Managers.Records
{
    public sealed class RecordsManager : IRecordsManager
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IUserAccessCalculation userAccessCalculation;
        private readonly IDirectoryResource directoryResource;
        private readonly IAccountsResource accountsResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly IV1CasesResource v1CasesResource;
        private readonly IV1ReferralsResource v1ReferralsResource;

        private readonly IV1ReferralNotesResource v1ReferralNotesResource;

        private readonly INotesResource notesResource;
        private readonly ICommunitiesResource communitiesResource;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;

        public RecordsManager(
            IPoliciesResource policiesResource,
            IAuthorizationEngine authorizationEngine,
            IPolicyEvaluationEngine policyEvaluationEngine,
            IUserAccessCalculation userAccessCalculation,
            IDirectoryResource directoryResource,
            IAccountsResource accountsResource,
            IApprovalsResource approvalsResource,
            IV1CasesResource v1CasesResource,
            IV1ReferralsResource v1ReferralsResource,
            IV1ReferralNotesResource v1ReferralNotesResource,
            INotesResource notesResource,
            ICommunitiesResource communitiesResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter
        )
        {
            this.policiesResource = policiesResource;
            this.authorizationEngine = authorizationEngine;
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.userAccessCalculation = userAccessCalculation;
            this.directoryResource = directoryResource;
            this.accountsResource = accountsResource;
            this.approvalsResource = approvalsResource;
            this.v1CasesResource = v1CasesResource;
            this.v1ReferralsResource = v1ReferralsResource;
            this.v1ReferralNotesResource = v1ReferralNotesResource;
            this.notesResource = notesResource;
            this.communitiesResource = communitiesResource;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }

        private async Task<SessionUserContext> CreateSessionUserContext(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
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
            var userContext = new SessionUserContext(user, userFamily);
            return userContext;
        }

        public async Task<ImmutableList<RecordsAggregate>> ListVisibleAggregatesAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );

            // The following permissions should not be construed as granting access to an actual aggregate.
            //TODO: More of this logic should be handled by the AuthorizationEngine.
            var irrelevantPermissions = ImmutableHashSet.Create(
                Permission.AccessCommunitiesScreen,
                Permission.AccessPartneringFamiliesScreen,
                Permission.AccessSettingsScreen,
                Permission.AccessVolunteersScreen
            );

            var families = await directoryResource.ListFamiliesAsync(organizationId, locationId);

            var visibleFamilies = (
                await families
                    .Select(async family =>
                    {
                        var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            userContext,
                            new FamilyAuthorizationContext(family.Id, family)
                        );
                        return (
                            family,
                            hasPermissions: permissions.Except(irrelevantPermissions).Any()
                        );
                    })
                    .WhenAll()
            ).Where(x => x.hasPermissions).Select(x => x.family).ToImmutableList();

            var renderedFamilies = (
                await visibleFamilies
                    .Select(async family =>
                    {
                        var renderedFamily =
                            await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                                organizationId,
                                locationPolicy,
                                locationId,
                                family.Id,
                                family,
                                userContext
                            );
                        if (renderedFamily == null)
                            return null;
                        return new FamilyRecordsAggregate(renderedFamily);
                    })
                    .WhenAll()
            ).WhereNotNull().ToImmutableList();

            var communities = await communitiesResource.ListLocationCommunitiesAsync(
                organizationId,
                locationId
            );

            var referrals = await v1ReferralsResource.ListReferralsAsync(
                organizationId,
                locationId
            );

            var renderedReferrals = (
                await referrals
                    .Select(async referral =>
                    {
                        var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            userContext,
                            new V1ReferralAuthorizationContext(referral.ReferralId)
                        );
                        if (!permissions.Contains(Permission.ViewV1Referral))
                            return null;

                        var renderedReferral = await RenderReferralAsync(
                            organizationId,
                            locationId,
                            userContext,
                            referral
                        );
                        return (RecordsAggregate)new ReferralRecordsAggregate(renderedReferral);
                    })
                    .WhenAll()
            ).WhereNotNull().ToImmutableList();

            var visibleCommunities = (
                await communities
                    .Select(async community =>
                    {
                        var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            userContext,
                            new CommunityAuthorizationContext(community.Id)
                        );
                        return (
                            community,
                            hasPermissions: permissions.Except(irrelevantPermissions).Any()
                        );
                    })
                    .WhenAll()
            ).Where(x => x.hasPermissions).Select(x => x.community).ToImmutableList();

            var renderedCommunities = await visibleCommunities
                .Select(async community =>
                {
                    //TODO: Rendering actions (e.g., permissions - which can be on a base aggregate type along with ID!)
                    var renderedCommunity = await authorizationEngine.DiscloseCommunityAsync(
                        userContext,
                        organizationId,
                        locationId,
                        new CommunityInfo(community, ImmutableList<Permission>.Empty)
                    );
                    return new CommunityRecordsAggregate(renderedCommunity);
                })
                .WhenAll();

            return renderedFamilies
                .Cast<RecordsAggregate>()
                .Concat(renderedCommunities)
                .Concat(renderedReferrals)
                .ToImmutableList();
        }

        public async Task<ImmutableList<RecordsAggregate>> ExecuteCompositeRecordsCommand(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CompositeRecordsCommand command
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var commandPlan = await GenerateCompositeCommandPlanAsync(
                organizationId,
                locationId,
                command
            );

            foreach (var userCommand in commandPlan.UserCommands)
                if (
                    !await AuthorizeCommandAsync(
                        organizationId,
                        locationId,
                        userContext,
                        userCommand
                    )
                )
                    throw new Exception("The user is not authorized to perform this command.");

            foreach (var userCommand in commandPlan.UserCommands)
                await ValidateCommandAsync(organizationId, locationId, userCommand);

            foreach (var plannedCommand in commandPlan.AllCommands)
                await ExecuteCommandAsync(organizationId, locationId, user, plannedCommand);

            return await RenderCompositeCommandResultAsync(
                organizationId,
                locationId,
                userContext,
                commandPlan.AllCommands
            );
        }

        public async Task<ImmutableList<RecordsAggregate>> ExecuteAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            if (!await AuthorizeCommandAsync(organizationId, locationId, userContext, command))
                throw new Exception("The user is not authorized to perform this command.");
            try
            {
                await ValidateCommandAsync(organizationId, locationId, command);
                await ExecuteCommandAsync(organizationId, locationId, user, command);

                return await RenderCommandResultAsync(
                    organizationId,
                    locationId,
                    userContext,
                    command
                );
            }
            catch
            {
                throw;
            }
        }

        public async Task<Uri> GetFamilyDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new FamilyAuthorizationContext(familyId)
            );

            if (!contextPermissions.Contains(Permission.ReadFamilyDocuments))
                throw new Exception("The user is not authorized to perform this command.");

            var valetUrl = await directoryResource.GetFamilyDocumentReadValetUrl(
                organizationId,
                locationId,
                familyId,
                documentId
            );

            return valetUrl;
        }

        public async Task<Uri> GenerateFamilyDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new FamilyAuthorizationContext(familyId, null)
            );

            if (!contextPermissions.Contains(Permission.UploadFamilyDocuments))
                throw new Exception("The user is not authorized to perform this command.");

            var valetUrl = await directoryResource.GetFamilyDocumentUploadValetUrl(
                organizationId,
                locationId,
                familyId,
                documentId
            );

            return valetUrl;
        }

        public async Task<Uri> GetCommunityDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid communityId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new CommunityAuthorizationContext(communityId)
            );

            if (!contextPermissions.Contains(Permission.ReadCommunityDocuments))
                throw new Exception("The user is not authorized to perform this command.");

            var valetUrl = await communitiesResource.GetCommunityDocumentReadValetUrl(
                organizationId,
                locationId,
                communityId,
                documentId
            );

            return valetUrl;
        }

        public async Task<Uri> GenerateCommunityDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid communityId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new CommunityAuthorizationContext(communityId)
            );

            if (!contextPermissions.Contains(Permission.UploadCommunityDocuments))
                throw new Exception("The user is not authorized to perform this command.");

            var valetUrl = await communitiesResource.GetCommunityDocumentUploadValetUrl(
                organizationId,
                locationId,
                communityId,
                documentId
            );

            return valetUrl;
        }

        public async Task<Uri> GetV1ReferralDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid referralId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var canViewReferrals = await authorizationEngine.AuthorizeV1ReferralReadAsync(
                organizationId,
                locationId,
                userContext
            );

            if (!canViewReferrals)
                throw new Exception("The user is not authorized to read referral documents.");

            return await v1ReferralsResource.GetV1ReferralDocumentReadValetUrl(
                organizationId,
                locationId,
                referralId,
                documentId
            );
        }

        public async Task<Uri> GenerateV1ReferralDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid referralId,
            Guid documentId
        )
        {
            var userContext = await CreateSessionUserContext(user, organizationId, locationId);

            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new GlobalAuthorizationContext()
            );

            if (!permissions.Contains(Permission.EditV1Referral))
                throw new Exception("The user is not authorized to upload referral documents.");

            return await v1ReferralsResource.GetV1ReferralDocumentUploadValetUrl(
                organizationId,
                locationId,
                referralId,
                documentId
            );
        }

        private sealed record CompositeCommandPlan(
            ImmutableList<AtomicRecordsCommand> UserCommands,
            ImmutableList<AtomicRecordsCommand> DerivedCommands
        )
        {
            public ImmutableList<AtomicRecordsCommand> AllCommands =>
                UserCommands.Concat(DerivedCommands).ToImmutableList();
        }

        private async Task<CompositeCommandPlan> GenerateCompositeCommandPlanAsync(
            Guid organizationId,
            Guid locationId,
            CompositeRecordsCommand command
        )
        {
            var userCommands = GenerateAtomicCommandsForCompositeCommand(command).ToImmutableList();
            var derivedCommands = await GenerateDerivedAtomicCommandsForCompositeCommandAsync(
                organizationId,
                locationId,
                command
            );

            return new CompositeCommandPlan(userCommands, derivedCommands);
        }

        private IEnumerable<AtomicRecordsCommand> GenerateAtomicCommandsForCompositeCommand(
            CompositeRecordsCommand command
        )
        {
            switch (command)
            {
                case AddAdultToFamilyCommand c:
                {
                    var addresses =
                        c.Address == null
                            ? ImmutableList<Address>.Empty
                            : ImmutableList<Address>.Empty.Add(c.Address);
                    var phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    var emailAddresses =
                        c.EmailAddress == null
                            ? ImmutableList<EmailAddress>.Empty
                            : ImmutableList<EmailAddress>.Empty.Add(c.EmailAddress);

                    yield return new PersonRecordsCommand(
                        c.FamilyId,
                        new CreatePerson(
                            c.PersonId,
                            c.FirstName,
                            c.LastName,
                            c.Gender,
                            c.Age,
                            c.Ethnicity,
                            addresses,
                            c.Address?.Id,
                            phoneNumbers,
                            c.PhoneNumber?.Id,
                            emailAddresses,
                            c.EmailAddress?.Id,
                            c.Concerns,
                            c.Notes
                        )
                    );
                    yield return new FamilyRecordsCommand(
                        new AddAdultToFamily(c.FamilyId, c.PersonId, c.FamilyAdultRelationshipInfo)
                    );
                    break;
                }
                case AddChildToFamilyCommand c:
                {
                    yield return new PersonRecordsCommand(
                        c.FamilyId,
                        new CreatePerson(
                            c.PersonId,
                            c.FirstName,
                            c.LastName,
                            c.Gender,
                            c.Age,
                            c.Ethnicity,
                            ImmutableList<Address>.Empty,
                            null,
                            ImmutableList<PhoneNumber>.Empty,
                            null,
                            ImmutableList<EmailAddress>.Empty,
                            null,
                            c.Concerns,
                            c.Notes
                        )
                    );
                    yield return new FamilyRecordsCommand(
                        new AddChildToFamily(
                            c.FamilyId,
                            c.PersonId,
                            c.CustodialRelationships.ToImmutableList()
                        )
                    );
                    break;
                }
                case CreateVolunteerFamilyWithNewAdultCommand c:
                {
                    var addresses =
                        c.Address == null
                            ? ImmutableList<Address>.Empty
                            : ImmutableList<Address>.Empty.Add(c.Address);
                    var phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    var emailAddresses =
                        c.EmailAddress == null
                            ? ImmutableList<EmailAddress>.Empty
                            : ImmutableList<EmailAddress>.Empty.Add(c.EmailAddress);

                    yield return new PersonRecordsCommand(
                        c.FamilyId,
                        new CreatePerson(
                            c.PersonId,
                            c.FirstName,
                            c.LastName,
                            c.Gender,
                            c.Age,
                            c.Ethnicity,
                            addresses,
                            c.Address?.Id,
                            phoneNumbers,
                            c.PhoneNumber?.Id,
                            emailAddresses,
                            c.EmailAddress?.Id,
                            c.Concerns,
                            c.Notes
                        )
                    );
                    yield return new FamilyRecordsCommand(
                        new CreateFamily(
                            c.FamilyId,
                            c.PersonId,
                            ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add(
                                (c.PersonId, c.FamilyAdultRelationshipInfo)
                            ),
                            ImmutableList<Guid>.Empty,
                            ImmutableList<CustodialRelationship>.Empty
                        )
                    );
                    yield return new FamilyApprovalRecordsCommand(
                        new ActivateVolunteerFamily(c.FamilyId)
                    );
                    break;
                }
                case CreatePartneringFamilyWithNewAdultCommand c:
                {
                    var addresses =
                        c.Address == null
                            ? ImmutableList<Address>.Empty
                            : ImmutableList<Address>.Empty.Add(c.Address);
                    var phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    var emailAddresses =
                        c.EmailAddress == null
                            ? ImmutableList<EmailAddress>.Empty
                            : ImmutableList<EmailAddress>.Empty.Add(c.EmailAddress);

                    yield return new PersonRecordsCommand(
                        c.FamilyId,
                        new CreatePerson(
                            c.PersonId,
                            c.FirstName,
                            c.LastName,
                            c.Gender,
                            c.Age,
                            c.Ethnicity,
                            addresses,
                            c.Address?.Id,
                            phoneNumbers,
                            c.PhoneNumber?.Id,
                            emailAddresses,
                            c.EmailAddress?.Id,
                            c.Concerns,
                            c.Notes
                        )
                    );
                    yield return new FamilyRecordsCommand(
                        new CreateFamily(
                            c.FamilyId,
                            c.PersonId,
                            ImmutableList<(Guid, FamilyAdultRelationshipInfo)>.Empty.Add(
                                (c.PersonId, c.FamilyAdultRelationshipInfo)
                            ),
                            ImmutableList<Guid>.Empty,
                            ImmutableList<CustodialRelationship>.Empty
                        )
                    );
                    break;
                }
                case LinkReferralToCaseAndAcceptCommand c:
                {
                    yield return new ReferralRecordsCommand(
                        new LinkReferralToCase(c.FamilyId, c.CaseId, c.ReferralId)
                    );
                    yield return new V1ReferralRecordsCommand(
                        new AcceptV1Referral(c.ReferralId, c.AcceptedAtUtc)
                    );
                    break;
                }
                case OpenCaseForReferralAndAcceptCommand c:
                {
                    yield return new ReferralRecordsCommand(
                        new CreateReferral(c.FamilyId, c.CaseId, c.OpenedAtUtc)
                    );
                    yield return new ReferralRecordsCommand(
                        new LinkReferralToCase(c.FamilyId, c.CaseId, c.ReferralId)
                    );
                    yield return new V1ReferralRecordsCommand(
                        new AcceptV1Referral(c.ReferralId, c.OpenedAtUtc)
                    );
                    break;
                }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    );
            }
        }

        private async Task<ImmutableList<AtomicRecordsCommand>> GenerateDerivedAtomicCommandsForCompositeCommandAsync(
            Guid organizationId,
            Guid locationId,
            CompositeRecordsCommand command
        )
        {
            var copiedStaffAssignmentCommands =
                await GenerateReferralStaffAssignmentCopyCommandsAsync(
                    organizationId,
                    locationId,
                    command
                );

            return copiedStaffAssignmentCommands
                .Select(command => (AtomicRecordsCommand)new ReferralRecordsCommand(command))
                .ToImmutableList();
        }

        private async Task<ImmutableList<V1CaseCommand>> GenerateReferralStaffAssignmentCopyCommandsAsync(
            Guid organizationId,
            Guid locationId,
            CompositeRecordsCommand command
        )
        {
            var copyTarget = command switch
            {
                LinkReferralToCaseAndAcceptCommand c => (
                    c.FamilyId,
                    c.CaseId,
                    c.ReferralId
                ),
                OpenCaseForReferralAndAcceptCommand c => (
                    c.FamilyId,
                    c.CaseId,
                    c.ReferralId
                ),
                _ => ((Guid FamilyId, Guid CaseId, Guid ReferralId)?)null,
            };

            if (copyTarget == null)
                return ImmutableList<V1CaseCommand>.Empty;

            var referral = await v1ReferralsResource.GetReferralAsync(
                organizationId,
                locationId,
                copyTarget.Value.ReferralId
            );
            if (referral == null)
                return ImmutableList<V1CaseCommand>.Empty;

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var caseStaffAssignmentRoles = locationPolicy
                .ReferralPolicy.StaffAssignmentPolicies.Select(policy => policy.AssignmentRole)
                .ToImmutableHashSet();

            return referral
                .StaffAssignments.Where(assignment =>
                    caseStaffAssignmentRoles.Contains(assignment.AssignmentRole)
                )
                .Select(assignment =>
                    (V1CaseCommand)new AssignStaffToV1Case(
                        copyTarget.Value.FamilyId,
                        copyTarget.Value.CaseId,
                        assignment.PersonId,
                        assignment.AssignmentRole
                    )
                )
                .ToImmutableList();
        }

        private Task<bool> AuthorizeCommandAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            AtomicRecordsCommand command
        ) =>
            command switch
            {
                FamilyRecordsCommand c => authorizationEngine.AuthorizeFamilyCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.Command
                ),
                PersonRecordsCommand c => authorizationEngine.AuthorizePersonCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.FamilyId,
                    c.Command
                ),
                FamilyApprovalRecordsCommand c =>
                    authorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                        organizationId,
                        locationId,
                        userContext,
                        c.Command
                    ),
                IndividualApprovalRecordsCommand c =>
                    authorizationEngine.AuthorizeVolunteerCommandAsync(
                        organizationId,
                        locationId,
                        userContext,
                        c.Command
                    ),
                ReferralRecordsCommand c => authorizationEngine.AuthorizeV1CaseCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.Command
                ),
                V1ReferralRecordsCommand c => authorizationEngine.AuthorizeV1ReferralCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.Command
                ),
                ArrangementRecordsCommand c =>
                    authorizationEngine.AuthorizeArrangementsCommandAsync(
                        organizationId,
                        locationId,
                        userContext,
                        c.Command
                    ),
                NoteRecordsCommand c => authorizationEngine.AuthorizeNoteCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.Command
                ),
                CommunityRecordsCommand c => authorizationEngine.AuthorizeCommunityCommandAsync(
                    organizationId,
                    locationId,
                    userContext,
                    c.Command
                ),
                V1ReferralNoteRecordsCommand => userAccessCalculation
                    .AuthorizeUserAccessAsync(
                        organizationId,
                        locationId,
                        userContext,
                        new GlobalAuthorizationContext()
                    )
                    .ContinueWith(t => t.Result.Contains(Permission.EditV1Referral)),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

        private async Task ExecuteCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            switch (command)
            {
                case FamilyRecordsCommand c:
                    await directoryResource.ExecuteFamilyCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case PersonRecordsCommand c:
                    await directoryResource.ExecutePersonCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case FamilyApprovalRecordsCommand c:
                    await approvalsResource.ExecuteVolunteerFamilyCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case IndividualApprovalRecordsCommand c:
                    await approvalsResource.ExecuteVolunteerCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case ReferralRecordsCommand c:
                    await v1CasesResource.ExecuteV1CaseCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case V1ReferralRecordsCommand c:
                    await v1ReferralsResource.ExecuteV1ReferralCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case ArrangementRecordsCommand c:
                    await v1CasesResource.ExecuteArrangementsCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case NoteRecordsCommand c:
                    await notesResource.ExecuteNoteCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case CommunityRecordsCommand c:
                    await communitiesResource.ExecuteCommunityCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                case V1ReferralNoteRecordsCommand c:
                    await v1ReferralNotesResource.ExecuteReferralNoteCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    );
                    return;
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    );
            }
        }

        private Task ValidateCommandAsync(
            Guid organizationId,
            Guid locationId,
            AtomicRecordsCommand command
        ) =>
            command switch
            {
                ReferralRecordsCommand c => ValidateStaffAssignmentCommandAsync(
                    organizationId,
                    locationId,
                    c.Command
                ),
                V1ReferralRecordsCommand c => ValidateStaffAssignmentCommandAsync(
                    organizationId,
                    locationId,
                    c.Command
                ),
                _ => Task.CompletedTask,
            };

        private async Task ValidateStaffAssignmentCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralCommand command
        )
        {
            if (command is not AssignStaffToV1Referral assignStaff)
                return;

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var assignmentPolicy = locationPolicy
                .V1ReferralPolicy.StaffAssignmentPolicies.SingleOrDefault(policy =>
                    policy.AssignmentRole == assignStaff.AssignmentRole
                );

            if (assignmentPolicy == null)
                throw new InvalidOperationException(
                    "The staff assignment role is not configured for referrals."
                );

            if (
                !await IsEligibleStaffAssigneeAsync(
                    organizationId,
                    locationId,
                    assignStaff.PersonId,
                    assignmentPolicy.Eligibility
                )
            )
                throw new InvalidOperationException(
                    "The selected person is not eligible for this staff assignment role."
                );
        }

        private async Task ValidateStaffAssignmentCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1CaseCommand command
        )
        {
            if (command is not AssignStaffToV1Case assignStaff)
                return;

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var assignmentPolicy = locationPolicy
                .ReferralPolicy.StaffAssignmentPolicies.SingleOrDefault(policy =>
                    policy.AssignmentRole == assignStaff.AssignmentRole
                );

            if (assignmentPolicy == null)
                throw new InvalidOperationException(
                    "The staff assignment role is not configured for cases."
                );

            if (
                !await IsEligibleStaffAssigneeAsync(
                    organizationId,
                    locationId,
                    assignStaff.PersonId,
                    assignmentPolicy.Eligibility
                )
            )
                throw new InvalidOperationException(
                    "The selected person is not eligible for this staff assignment role."
                );
        }

        private async Task<bool> IsEligibleStaffAssigneeAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId,
            StaffAssignmentEligibility eligibility
        )
        {
            var person = (await directoryResource.ListPeopleAsync(organizationId, locationId))
                .SingleOrDefault(person => person.Id == personId);

            if (person == null || !person.Active)
                return false;

            var locationRoles =
                await accountsResource.TryGetPersonRolesAsync(organizationId, locationId, personId)
                ?? ImmutableList<string>.Empty;
            if (locationRoles.Intersect(eligibility.EligibleLocationRoles).Any())
                return true;

            if (eligibility.EligiblePeople.Contains(personId))
                return true;

            if (
                eligibility.EligibleIndividualVolunteerRoles.IsEmpty
                && eligibility.EligibleVolunteerFamilyRoles.IsEmpty
            )
                return false;

            var family = await directoryResource.FindPersonFamilyAsync(
                organizationId,
                locationId,
                personId
            );
            if (family == null || !family.Active)
                return false;

            var volunteerFamily = await approvalsResource.TryGetVolunteerFamilyAsync(
                organizationId,
                locationId,
                family.Id
            );
            if (volunteerFamily == null)
                return false;

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var combinedApprovals =
                await policyEvaluationEngine.CalculateCombinedFamilyApprovalsAsync(
                    organizationId,
                    locationId,
                    family,
                    volunteerFamily.CompletedRequirements,
                    volunteerFamily.ExemptedRequirements,
                    volunteerFamily.RoleRemovals,
                    volunteerFamily.IndividualEntries.ToImmutableDictionary(
                        entry => entry.Key,
                        entry => entry.Value.CompletedRequirements
                    ),
                    volunteerFamily.IndividualEntries.ToImmutableDictionary(
                        entry => entry.Key,
                        entry => entry.Value.ExemptedRequirements
                    ),
                    volunteerFamily.IndividualEntries.ToImmutableDictionary(
                        entry => entry.Key,
                        entry => entry.Value.RoleRemovals
                    )
                );

            var hasEligibleIndividualRole =
                combinedApprovals.IndividualApprovals.TryGetValue(
                    personId,
                    out var individualApproval
                )
                && individualApproval.ApprovalStatusByRole.Any(role =>
                    eligibility.EligibleIndividualVolunteerRoles.Contains(role.Key)
                    && IsApprovedOrOnboarded(role.Value.CurrentStatus)
                );

            if (hasEligibleIndividualRole)
                return true;

            return combinedApprovals.FamilyRoleApprovals.Any(role =>
                eligibility.EligibleVolunteerFamilyRoles.Contains(role.Key)
                && IsApprovedOrOnboarded(role.Value.CurrentStatus)
            );
        }

        private static bool IsApprovedOrOnboarded(RoleApprovalStatus? status) =>
            status is RoleApprovalStatus.Approved or RoleApprovalStatus.Onboarded;

        private async Task<ImmutableList<RecordsAggregate>> RenderCommandResultAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            AtomicRecordsCommand command
        )
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );

            if (command is V1ReferralRecordsCommand referralCommand)
            {
                var referralId = referralCommand.Command.ReferralId;

                var referral = await v1ReferralsResource.GetReferralAsync(
                    organizationId,
                    locationId,
                    referralId
                );

                if (referral == null)
                    throw new InvalidOperationException("Referral not found.");

                var renderedReferral = await RenderReferralAsync(
                    organizationId,
                    locationId,
                    userContext,
                    referral
                );

                var results = ImmutableList.CreateBuilder<RecordsAggregate>();
                results.Add(new ReferralRecordsAggregate(renderedReferral));

                if (renderedReferral.Referral.FamilyId.HasValue)
                {
                    var familyResult =
                        await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                            organizationId,
                            locationPolicy,
                            locationId,
                            renderedReferral.Referral.FamilyId.Value,
                            null,
                            userContext
                        );

                    if (familyResult != null)
                        results.Add(new FamilyRecordsAggregate(familyResult));
                }

                return results.ToImmutable();
            }

            if (command is V1ReferralNoteRecordsCommand noteCommand)
            {
                var referralId = noteCommand.Command.ReferralId;

                var referral = await v1ReferralsResource.GetReferralAsync(
                    organizationId,
                    locationId,
                    referralId
                );

                if (referral == null)
                    throw new InvalidOperationException("Referral not found.");

                var renderedReferral = await RenderReferralAsync(
                    organizationId,
                    locationId,
                    userContext,
                    referral
                );

                return ImmutableList.Create<RecordsAggregate>(
                    new ReferralRecordsAggregate(renderedReferral)
                );
            }
            if (command is CommunityRecordsCommand c)
            {
                var communityId = c.Command.CommunityId;

                var communities = await communitiesResource.ListLocationCommunitiesAsync(
                    organizationId,
                    locationId
                );
                var community = communities.Single(community => community.Id == communityId);

                var communityInfo = new CommunityInfo(community, ImmutableList<Permission>.Empty);

                var communityResult = await authorizationEngine.DiscloseCommunityAsync(
                    userContext,
                    organizationId,
                    locationId,
                    communityInfo
                );

                return [new CommunityRecordsAggregate(communityResult)];
            }
            else
            {
                var familyIds = GetFamilyIdsFromCommand(command);

                var familyResults = await Task.WhenAll(
                    familyIds.Select(familyId =>
                        combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                            organizationId,
                            locationPolicy,
                            locationId,
                            familyId,
                            null,
                            userContext
                        )
                    )
                );

                return familyResults
                    .OfType<CombinedFamilyInfo>() // Filters out null values
                    .Select(result => new FamilyRecordsAggregate(result))
                    .ToImmutableList<RecordsAggregate>();
            }
        }

        private async Task<ImmutableList<RecordsAggregate>> RenderCompositeCommandResultAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            ImmutableList<AtomicRecordsCommand> atomicCommands
        )
        {
            var renderedAggregates = (
                await Task.WhenAll(
                    atomicCommands.Select(atomicCommand =>
                        RenderCommandResultAsync(
                            organizationId,
                            locationId,
                            userContext,
                            atomicCommand
                        )
                    )
                )
            ).SelectMany(results => results);

            return renderedAggregates
                .GroupBy(aggregate => (aggregate.Id, AggregateType: aggregate.GetType()))
                .Select(group => group.Last())
                .ToImmutableList();
        }

        private Guid[] GetFamilyIdsFromCommand(AtomicRecordsCommand command) =>
            command switch
            {
                FamilyRecordsCommand c => [c.Command.FamilyId],
                PersonRecordsCommand c => [c.FamilyId],
                FamilyApprovalRecordsCommand c => [c.Command.FamilyId],
                IndividualApprovalRecordsCommand c => [c.Command.FamilyId],
                ReferralRecordsCommand c => [c.Command.FamilyId],
                V1ReferralRecordsCommand c => c.Command switch
                {
                    UpdateV1ReferralFamily update => [update.FamilyId],
                    CreateV1Referral create when create.FamilyId.HasValue =>
                    [
                        create.FamilyId.Value,
                    ],
                    _ => Array.Empty<Guid>(),
                },
                V1ReferralNoteRecordsCommand c => Array.Empty<Guid>(),
                ArrangementRecordsCommand c => c.Command switch
                {
                    AssignVolunteerFamily actualCommand =>
                    [
                        actualCommand.FamilyId,
                        actualCommand.VolunteerFamilyId,
                    ],
                    UnassignVolunteerFamily actualCommand =>
                    [
                        actualCommand.FamilyId,
                        actualCommand.VolunteerFamilyId,
                    ],
                    AssignIndividualVolunteer actualCommand =>
                    [
                        actualCommand.FamilyId,
                        actualCommand.VolunteerFamilyId,
                    ],
                    UnassignIndividualVolunteer actualCommand =>
                    [
                        actualCommand.FamilyId,
                        actualCommand.VolunteerFamilyId,
                    ],
                    _ => [c.Command.FamilyId],
                },
                NoteRecordsCommand c => [c.Command.FamilyId],
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

        private async Task<V1ReferralInfo> RenderReferralAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            V1Referral referral
        )
        {
            referral = await PopulateMissingReferralIntakeRequirementsAsync(
                organizationId,
                locationId,
                referral
            );

            var notes = await v1ReferralNotesResource.ListReferralNotesAsync(
                organizationId,
                locationId,
                referral.ReferralId
            );

            var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                userContext,
                new V1ReferralAuthorizationContext(referral.ReferralId)
            );

            var canViewStaffAssignments = permissions.Contains(
                Permission.ViewV1ReferralStaffAssignments
            );

            var disclosedReferral = referral with
            {
                Notes = notes,
                StaffAssignments = canViewStaffAssignments
                    ? referral.StaffAssignments
                    : ImmutableList<StaffAssignment>.Empty,
                History = canViewStaffAssignments
                    ? referral.History
                    : referral
                        .History.Where(activity =>
                            activity is not V1ReferralStaffAssigned
                                and not V1ReferralStaffUnassigned
                        )
                        .ToImmutableList(),
            };

            return new V1ReferralInfo(disclosedReferral, permissions);
        }

        private async Task<V1Referral> PopulateMissingReferralIntakeRequirementsAsync(
            Guid organizationId,
            Guid locationId,
            V1Referral referral
        )
        {
            var missingIntakeRequirements =
                await policyEvaluationEngine.CalculateMissingV1ReferralIntakeRequirementsAsync(
                    organizationId,
                    locationId,
                    referral
                );

            return referral with
            {
                MissingIntakeRequirements = missingIntakeRequirements,
            };
        }
    }
}
