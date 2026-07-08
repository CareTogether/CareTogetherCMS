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
using ArrangementAssignIndividualVolunteer = CareTogether.Resources.V1Cases.AssignIndividualVolunteer;
using ArrangementUnassignIndividualVolunteer = CareTogether.Resources.V1Cases.UnassignIndividualVolunteer;
using V1CaseAssignIndividualVolunteer = CareTogether.Resources.V1Cases.V1CaseCommands.AssignIndividualVolunteer;
using V1CaseUnassignIndividualVolunteer = CareTogether.Resources.V1Cases.V1CaseCommands.UnassignIndividualVolunteer;
using V1ReferralAssignIndividualVolunteer = CareTogether.Resources.V1Referrals.AssignIndividualVolunteer;

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
            var familiesTask = directoryResource.ListFamiliesAsync(organizationId, locationId);
            var locationPolicyTask = policiesResource.GetCurrentPolicy(organizationId, locationId);
            var communitiesTask = communitiesResource.ListLocationCommunitiesAsync(
                organizationId,
                locationId
            );
            var referralsTask = v1ReferralsResource.ListReferralsAsync(organizationId, locationId);

            await Task.WhenAll(familiesTask, locationPolicyTask, communitiesTask, referralsTask);
            var families = await familiesTask;
            var locationPolicy = await locationPolicyTask;
            var communities = await communitiesTask;
            var referrals = await referralsTask;
            var authorizationSnapshot = await userAccessCalculation.CreateSnapshotAsync(
                organizationId,
                locationId,
                userContext,
                families,
                referrals,
                communities
            );
            var renderingSnapshot = await combinedFamilyInfoFormatter.CreateRenderingSnapshotAsync(
                organizationId,
                locationId,
                locationPolicy,
                referrals
            );

            // The following permissions should not be construed as granting access to an actual aggregate.
            //TODO: More of this logic should be handled by the AuthorizationEngine.
            var irrelevantPermissions = ImmutableHashSet.Create(
                Permission.AccessCommunitiesScreen,
                Permission.AccessPartneringFamiliesScreen,
                Permission.AccessSettingsScreen,
                Permission.AccessVolunteersScreen
            );

            var visibleFamilies = (
                families.Select(family =>
                {
                    var permissions = userAccessCalculation.AuthorizeUserAccess(
                        authorizationSnapshot,
                        new FamilyAuthorizationContext(family.Id, family)
                    );
                    return (
                        family,
                        permissions,
                        hasPermissions: permissions.Except(irrelevantPermissions).Any()
                    );
                })
            ).Where(x => x.hasPermissions).ToImmutableList();

            var renderedFamilies = (
                await visibleFamilies
                    .Select(async familyAccess =>
                    {
                        var renderedFamily =
                            await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                                organizationId,
                                locationPolicy,
                                locationId,
                                familyAccess.family.Id,
                                familyAccess.family,
                                userContext,
                                familyAccess.permissions.ToImmutableList(),
                                renderingSnapshot
                            );
                        if (renderedFamily == null)
                            return null;
                        return new FamilyRecordsAggregate(renderedFamily);
                    })
                    .WhenAll()
            ).WhereNotNull().ToImmutableList();

            var renderedReferrals = (
                await referrals
                    .Select(async referral =>
                    {
                        var permissions = userAccessCalculation.AuthorizeUserAccess(
                            authorizationSnapshot,
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
                communities.Select(community =>
                {
                    var permissions = userAccessCalculation.AuthorizeUserAccess(
                        authorizationSnapshot,
                        new CommunityAuthorizationContext(community.Id)
                    );
                    return (
                        community,
                        permissions,
                        hasPermissions: permissions.Except(irrelevantPermissions).Any()
                    );
                })
            ).Where(x => x.hasPermissions).ToImmutableList();

            var renderedCommunities = await visibleCommunities
                .Select(async communityAccess =>
                {
                    //TODO: Rendering actions (e.g., permissions - which can be on a base aggregate type along with ID!)
                    var renderedCommunity = await authorizationEngine.DiscloseCommunityAsync(
                        userContext,
                        organizationId,
                        locationId,
                        new CommunityInfo(
                            communityAccess.community,
                            ImmutableList<Permission>.Empty
                        ),
                        communityAccess.permissions
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

            // User commands are the requested workflow steps and must pass authorization.
            // Derived commands are workflow side effects covered by the authorized user commands.
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

                var commandResultRenderingContext =
                    await CreateCommandResultRenderingContextAsync(
                        organizationId,
                        locationId,
                        command
                    );

                await ExecuteCommandAsync(organizationId, locationId, user, command);

                return await RenderCommandResultAsync(
                    organizationId,
                    locationId,
                    userContext,
                    command,
                    commandResultRenderingContext
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

        private async Task<
            ImmutableList<AtomicRecordsCommand>
        > GenerateDerivedAtomicCommandsForCompositeCommandAsync(
            Guid organizationId,
            Guid locationId,
            CompositeRecordsCommand command
        )
        {
            var derivedV1CaseCommands = command switch
            {
                LinkReferralToCaseAndAcceptCommand c =>
                    await GenerateReferralVolunteerAssignmentCopyCommandsAsync(
                        organizationId,
                        locationId,
                        c.FamilyId,
                        c.CaseId,
                        c.ReferralId
                    ),
                OpenCaseForReferralAndAcceptCommand c =>
                    await GenerateReferralVolunteerAssignmentCopyCommandsAsync(
                        organizationId,
                        locationId,
                        c.FamilyId,
                        c.CaseId,
                        c.ReferralId
                    ),
                _ => ImmutableList<V1CaseCommand>.Empty,
            };

            return derivedV1CaseCommands
                .Select(command => (AtomicRecordsCommand)new ReferralRecordsCommand(command))
                .ToImmutableList();
        }

        private async Task<
            ImmutableList<V1CaseCommand>
        > GenerateReferralVolunteerAssignmentCopyCommandsAsync(
            Guid organizationId,
            Guid locationId,
            Guid familyId,
            Guid caseId,
            Guid referralId
        )
        {
            var referral = await v1ReferralsResource.GetReferralAsync(
                organizationId,
                locationId,
                referralId
            );
            if (referral == null)
                return ImmutableList<V1CaseCommand>.Empty;

            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var caseFunctionAssignmentRoles = locationPolicy
                .ReferralPolicy.FunctionAssignmentPolicies.Select(policy => policy.AssignmentRole)
                .ToImmutableHashSet();

            return referral
                .AssignedIndividualVolunteers.Where(assignment =>
                    caseFunctionAssignmentRoles.Contains(assignment.AssignmentRole)
                )
                .Select(assignment =>
                    (V1CaseCommand)
                        new V1CaseAssignIndividualVolunteer(
                            familyId,
                            caseId,
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
                ReferralRecordsCommand
                {
                    Command: V1CaseAssignIndividualVolunteer assignIndividualVolunteer
                } => ValidateIndividualVolunteerAssignmentCommandAsync(
                    organizationId,
                    locationId,
                    assignIndividualVolunteer
                ),
                V1ReferralRecordsCommand
                {
                    Command: V1ReferralAssignIndividualVolunteer assignIndividualVolunteer
                } => ValidateIndividualVolunteerAssignmentCommandAsync(
                    organizationId,
                    locationId,
                    assignIndividualVolunteer
                ),
                _ => Task.CompletedTask,
            };

        private async Task ValidateIndividualVolunteerAssignmentCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1ReferralAssignIndividualVolunteer assignIndividualVolunteer
        )
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var assignmentPolicy =
                locationPolicy.V1ReferralPolicy.FunctionAssignmentPolicies.SingleOrDefault(policy =>
                    policy.AssignmentRole == assignIndividualVolunteer.AssignmentRole
                );

            if (assignmentPolicy == null)
                throw new InvalidOperationException(
                    "The volunteer assignment role is not configured for referrals."
                );

            if (
                !await IsEligibleVolunteerAssigneeAsync(
                    organizationId,
                    locationId,
                    assignIndividualVolunteer.PersonId,
                    assignmentPolicy.Eligibility
                )
            )
                throw new InvalidOperationException(
                    "The selected person is not eligible for this volunteer assignment role."
                );
        }

        private async Task ValidateIndividualVolunteerAssignmentCommandAsync(
            Guid organizationId,
            Guid locationId,
            V1CaseAssignIndividualVolunteer assignIndividualVolunteer
        )
        {
            var locationPolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                locationId
            );
            var assignmentPolicy =
                locationPolicy.ReferralPolicy.FunctionAssignmentPolicies.SingleOrDefault(policy =>
                    policy.AssignmentRole == assignIndividualVolunteer.AssignmentRole
                );

            if (assignmentPolicy == null)
                throw new InvalidOperationException(
                    "The volunteer assignment role is not configured for cases."
                );

            if (
                !await IsEligibleVolunteerAssigneeAsync(
                    organizationId,
                    locationId,
                    assignIndividualVolunteer.PersonId,
                    assignmentPolicy.Eligibility
                )
            )
                throw new InvalidOperationException(
                    "The selected person is not eligible for this volunteer assignment role."
                );
        }

        private async Task<bool> IsEligibleVolunteerAssigneeAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId,
            FunctionAssignmentEligibility eligibility
        )
        {
            var person = (
                await directoryResource.ListPeopleAsync(organizationId, locationId)
            ).SingleOrDefault(person => person.Id == personId);

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

            var approvalCalculation =
                await policyEvaluationEngine.CalculateVolunteerFamilyApprovalsAsync(
                    organizationId,
                    locationId,
                    family,
                    volunteerFamily
                );
            var combinedApprovals = approvalCalculation.ApprovalStatus;

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

        private sealed record CommandResultRenderingContext(
            ImmutableDictionary<
                Guid,
                ImmutableHashSet<Guid>
            > PreviouslyLinkedReferralFamilyIdsByReferralId
        )
        {
            public static CommandResultRenderingContext Empty { get; } =
                new(ImmutableDictionary<Guid, ImmutableHashSet<Guid>>.Empty);
        }

        private async Task<CommandResultRenderingContext> CreateCommandResultRenderingContextAsync(
            Guid organizationId,
            Guid locationId,
            AtomicRecordsCommand command
        )
        {
            if (command is not V1ReferralRecordsCommand { Command: UpdateV1ReferralFamily update })
                return CommandResultRenderingContext.Empty;

            var referral = await v1ReferralsResource.GetReferralAsync(
                organizationId,
                locationId,
                update.ReferralId
            );

            if (referral?.FamilyId is not Guid familyId)
                return CommandResultRenderingContext.Empty;

            return new CommandResultRenderingContext(
                ImmutableDictionary<Guid, ImmutableHashSet<Guid>>.Empty.SetItem(
                    update.ReferralId,
                    ImmutableHashSet.Create(familyId)
                )
            );
        }

        private async Task<RecordsAggregate?> RenderFamilyRecordsAggregateAsync(
            Guid organizationId,
            EffectiveLocationPolicy locationPolicy,
            Guid locationId,
            Guid familyId,
            SessionUserContext userContext
        )
        {
            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationPolicy,
                locationId,
                familyId,
                null,
                userContext
            );

            return familyResult == null ? null : new FamilyRecordsAggregate(familyResult);
        }

        private async Task<ImmutableList<RecordsAggregate>> RenderCommandResultAsync(
            Guid organizationId,
            Guid locationId,
            SessionUserContext userContext,
            AtomicRecordsCommand command,
            CommandResultRenderingContext? commandResultRenderingContext = null
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

                var linkedFamilyIds = commandResultRenderingContext != null
                    && commandResultRenderingContext
                        .PreviouslyLinkedReferralFamilyIdsByReferralId.TryGetValue(
                        referralId,
                        out var previousFamilyIds
                    )
                    ? previousFamilyIds
                    : ImmutableHashSet<Guid>.Empty;

                if (renderedReferral.Referral.FamilyId.HasValue)
                    linkedFamilyIds = linkedFamilyIds.Add(renderedReferral.Referral.FamilyId.Value);

                var linkedFamilyResults = await Task.WhenAll(
                    linkedFamilyIds.Select(familyId =>
                        RenderFamilyRecordsAggregateAsync(
                            organizationId,
                            locationPolicy,
                            locationId,
                            familyId,
                            userContext
                        )
                    )
                );

                results.AddRange(linkedFamilyResults.WhereNotNull());

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
                        RenderFamilyRecordsAggregateAsync(
                            organizationId,
                            locationPolicy,
                            locationId,
                            familyId,
                            userContext
                        )
                    )
                );

                return familyResults.WhereNotNull().ToImmutableList();
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
                .GroupBy(aggregate => aggregate.Id)
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
                    ArrangementAssignIndividualVolunteer actualCommand =>
                    [
                        actualCommand.FamilyId,
                        actualCommand.VolunteerFamilyId,
                    ],
                    ArrangementUnassignIndividualVolunteer actualCommand =>
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

            var canViewFunctionAssignments = permissions.Contains(
                Permission.ViewV1ReferralFunctionAssignments
            );

            var disclosedReferral = referral with
            {
                Notes = notes,
                AssignedIndividualVolunteers = canViewFunctionAssignments
                    ? referral.AssignedIndividualVolunteers
                    : ImmutableList<AssignedIndividualVolunteer>.Empty,
                History = canViewFunctionAssignments
                    ? referral.History
                    : referral
                        .History.Where(activity =>
                            activity
                                is not V1ReferralIndividualVolunteerAssigned
                                    and not V1ReferralIndividualVolunteerUnassigned
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
