﻿using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Notes;
using CareTogether.Resources.Referrals;
using Nito.AsyncEx;
using Nito.Disposables.Internals;

namespace CareTogether.Managers.Records
{
    public sealed class RecordsManager : IRecordsManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IUserAccessCalculation userAccessCalculation;
        private readonly IDirectoryResource directoryResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly IReferralsResource referralsResource;
        private readonly INotesResource notesResource;
        private readonly ICommunitiesResource communitiesResource;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;

        public RecordsManager(
            IAuthorizationEngine authorizationEngine,
            IUserAccessCalculation userAccessCalculation,
            IDirectoryResource directoryResource,
            IApprovalsResource approvalsResource,
            IReferralsResource referralsResource,
            INotesResource notesResource,
            ICommunitiesResource communitiesResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter
        )
        {
            this.authorizationEngine = authorizationEngine;
            this.userAccessCalculation = userAccessCalculation;
            this.directoryResource = directoryResource;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.notesResource = notesResource;
            this.communitiesResource = communitiesResource;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }

        public async Task<ImmutableList<RecordsAggregate>> ListVisibleAggregatesAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        )
        {
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
                            user,
                            new FamilyAuthorizationContext(family.Id)
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
                                locationId,
                                family.Id,
                                user
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

            var visibleCommunities = (
                await communities
                    .Select(async community =>
                    {
                        var permissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            user,
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
                        user,
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
                .ToImmutableList();
        }

        public async Task<RecordsAggregate?> ExecuteCompositeRecordsCommand(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CompositeRecordsCommand command
        )
        {
            var atomicCommands = GenerateAtomicCommandsForCompositeCommand(command)
                .ToImmutableList();

            foreach (var atomicCommand in atomicCommands)
                if (!await AuthorizeCommandAsync(organizationId, locationId, user, atomicCommand))
                    throw new Exception("The user is not authorized to perform this command.");

            foreach (var atomicCommand in atomicCommands)
                await ExecuteCommandAsync(organizationId, locationId, user, atomicCommand);

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationId,
                command.FamilyId,
                user
            );

            return familyResult == null ? null : new FamilyRecordsAggregate(familyResult);
        }

        public async Task<ImmutableList<RecordsAggregate>> ExecuteAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            if (!await AuthorizeCommandAsync(organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            await ExecuteCommandAsync(organizationId, locationId, user, command);

            return await RenderCommandResultAsync(organizationId, locationId, user, command);
        }

        public async Task<Uri> GetFamilyDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            Guid familyId,
            Guid documentId
        )
        {
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
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
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(familyId)
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
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
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
            var contextPermissions = await userAccessCalculation.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
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
                    yield return new ReferralRecordsCommand(
                        new CreateReferral(c.FamilyId, c.ReferralId, c.ReferralOpenedAtUtc)
                    );
                    break;
                }
                default:
                    throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    );
            }
        }

        private Task<bool> AuthorizeCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        ) =>
            command switch
            {
                FamilyRecordsCommand c => authorizationEngine.AuthorizeFamilyCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                PersonRecordsCommand c => authorizationEngine.AuthorizePersonCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.FamilyId,
                    c.Command
                ),
                FamilyApprovalRecordsCommand c =>
                    authorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                        organizationId,
                        locationId,
                        user,
                        c.Command
                    ),
                IndividualApprovalRecordsCommand c =>
                    authorizationEngine.AuthorizeVolunteerCommandAsync(
                        organizationId,
                        locationId,
                        user,
                        c.Command
                    ),
                ReferralRecordsCommand c => authorizationEngine.AuthorizeReferralCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                ArrangementRecordsCommand c =>
                    authorizationEngine.AuthorizeArrangementsCommandAsync(
                        organizationId,
                        locationId,
                        user,
                        c.Command
                    ),
                NoteRecordsCommand c => authorizationEngine.AuthorizeNoteCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                CommunityRecordsCommand c => authorizationEngine.AuthorizeCommunityCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

        private Task ExecuteCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        ) =>
            command switch
            {
                FamilyRecordsCommand c => directoryResource.ExecuteFamilyCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                PersonRecordsCommand c => directoryResource.ExecutePersonCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                FamilyApprovalRecordsCommand c =>
                    approvalsResource.ExecuteVolunteerFamilyCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    ),
                IndividualApprovalRecordsCommand c =>
                    approvalsResource.ExecuteVolunteerCommandAsync(
                        organizationId,
                        locationId,
                        c.Command,
                        user.UserId()
                    ),
                ReferralRecordsCommand c => referralsResource.ExecuteReferralCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                ArrangementRecordsCommand c => referralsResource.ExecuteArrangementsCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                NoteRecordsCommand c => notesResource.ExecuteNoteCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                CommunityRecordsCommand c => communitiesResource.ExecuteCommunityCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };

        private async Task<ImmutableList<RecordsAggregate>> RenderCommandResultAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
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
                    user,
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
                            locationId,
                            familyId,
                            user
                        )
                    )
                );

                return familyResults
                    .OfType<CombinedFamilyInfo>() // Filters out null values
                    .Select(result => new FamilyRecordsAggregate(result))
                    .ToImmutableList<RecordsAggregate>();
            }
        }

        private Guid[] GetFamilyIdsFromCommand(AtomicRecordsCommand command) =>
            command switch
            {
                FamilyRecordsCommand c => [c.Command.FamilyId],
                PersonRecordsCommand c => [c.FamilyId],
                FamilyApprovalRecordsCommand c => [c.Command.FamilyId],
                IndividualApprovalRecordsCommand c => [c.Command.FamilyId],
                ReferralRecordsCommand c => [c.Command.FamilyId],
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
    }
}
