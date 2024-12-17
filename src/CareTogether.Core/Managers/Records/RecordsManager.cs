using System;
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
        readonly IApprovalsResource _ApprovalsResource;
        readonly IAuthorizationEngine _AuthorizationEngine;
        readonly CombinedFamilyInfoFormatter _CombinedFamilyInfoFormatter;
        readonly ICommunitiesResource _CommunitiesResource;
        readonly IDirectoryResource _DirectoryResource;
        readonly INotesResource _NotesResource;
        readonly IReferralsResource _ReferralsResource;

        public RecordsManager(
            IAuthorizationEngine authorizationEngine,
            IDirectoryResource directoryResource,
            IApprovalsResource approvalsResource,
            IReferralsResource referralsResource,
            INotesResource notesResource,
            ICommunitiesResource communitiesResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter
        )
        {
            _AuthorizationEngine = authorizationEngine;
            _DirectoryResource = directoryResource;
            _ApprovalsResource = approvalsResource;
            _ReferralsResource = referralsResource;
            _NotesResource = notesResource;
            _CommunitiesResource = communitiesResource;
            _CombinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }

        public async Task<ImmutableList<RecordsAggregate>> ListVisibleAggregatesAsync(
            ClaimsPrincipal user,
            Guid organizationId,
            Guid locationId
        )
        {
            // The following permissions should not be construed as granting access to an actual aggregate.
            //TODO: More of this logic should be handled by the AuthorizationEngine.
            ImmutableHashSet<Permission> irrelevantPermissions = ImmutableHashSet.Create(
                Permission.AccessCommunitiesScreen,
                Permission.AccessPartneringFamiliesScreen,
                Permission.AccessSettingsScreen,
                Permission.AccessVolunteersScreen
            );

            ImmutableList<Family> families = await _DirectoryResource.ListFamiliesAsync(organizationId, locationId);

            ImmutableList<Family> visibleFamilies = (
                await families
                    .Select(async family =>
                    {
                        ImmutableList<Permission> permissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            user,
                            new FamilyAuthorizationContext(family.Id)
                        );
                        return (family, hasPermissions: permissions.Except(irrelevantPermissions).Any());
                    })
                    .WhenAll()
            ).Where(x => x.hasPermissions).Select(x => x.family).ToImmutableList();

            ImmutableList<FamilyRecordsAggregate> renderedFamilies = (
                await visibleFamilies
                    .Select(async family =>
                    {
                        CombinedFamilyInfo? renderedFamily =
                            await _CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                                organizationId,
                                locationId,
                                family.Id,
                                user
                            );
                        if (renderedFamily == null)
                        {
                            return null;
                        }

                        return new FamilyRecordsAggregate(renderedFamily);
                    })
                    .WhenAll()
            ).WhereNotNull().ToImmutableList();

            ImmutableList<Community> communities = await _CommunitiesResource.ListLocationCommunitiesAsync(
                organizationId,
                locationId
            );

            ImmutableList<Community> visibleCommunities = (
                await communities
                    .Select(async community =>
                    {
                        ImmutableList<Permission> permissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                            organizationId,
                            locationId,
                            user,
                            new CommunityAuthorizationContext(community.Id)
                        );
                        return (community, hasPermissions: permissions.Except(irrelevantPermissions).Any());
                    })
                    .WhenAll()
            ).Where(x => x.hasPermissions).Select(x => x.community).ToImmutableList();

            CommunityRecordsAggregate[] renderedCommunities = await visibleCommunities
                .Select(async community =>
                {
                    //TODO: Rendering actions (e.g., permissions - which can be on a base aggregate type along with ID!)
                    CommunityInfo renderedCommunity = await _AuthorizationEngine.DiscloseCommunityAsync(
                        user,
                        organizationId,
                        locationId,
                        new CommunityInfo(community, ImmutableList<Permission>.Empty)
                    );
                    return new CommunityRecordsAggregate(renderedCommunity);
                })
                .WhenAll();

            return renderedFamilies.Cast<RecordsAggregate>().Concat(renderedCommunities).ToImmutableList();
        }

        public async Task<RecordsAggregate?> ExecuteCompositeRecordsCommand(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            CompositeRecordsCommand command
        )
        {
            ImmutableList<AtomicRecordsCommand> atomicCommands = GenerateAtomicCommandsForCompositeCommand(command)
                .ToImmutableList();

            foreach (AtomicRecordsCommand? atomicCommand in atomicCommands)
            {
                if (!await AuthorizeCommandAsync(organizationId, locationId, user, atomicCommand))
                {
                    throw new InvalidOperationException("The user is not authorized to perform this command.");
                }
            }

            foreach (AtomicRecordsCommand? atomicCommand in atomicCommands)
            {
                await ExecuteCommandAsync(organizationId, locationId, user, atomicCommand);
            }

            CombinedFamilyInfo? familyResult = await _CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationId,
                command.FamilyId,
                user
            );

            return familyResult == null ? null : new FamilyRecordsAggregate(familyResult);
        }

        public async Task<RecordsAggregate?> ExecuteAtomicRecordsCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            if (!await AuthorizeCommandAsync(organizationId, locationId, user, command))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

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
            ImmutableList<Permission> contextPermissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(familyId)
            );

            if (!contextPermissions.Contains(Permission.ReadFamilyDocuments))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            Uri valetUrl = await _DirectoryResource.GetFamilyDocumentReadValetUrl(
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
            ImmutableList<Permission> contextPermissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new FamilyAuthorizationContext(familyId)
            );

            if (!contextPermissions.Contains(Permission.UploadFamilyDocuments))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            Uri valetUrl = await _DirectoryResource.GetFamilyDocumentUploadValetUrl(
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
            ImmutableList<Permission> contextPermissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new CommunityAuthorizationContext(communityId)
            );

            if (!contextPermissions.Contains(Permission.ReadCommunityDocuments))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            Uri valetUrl = await _CommunitiesResource.GetCommunityDocumentReadValetUrl(
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
            ImmutableList<Permission> contextPermissions = await _AuthorizationEngine.AuthorizeUserAccessAsync(
                organizationId,
                locationId,
                user,
                new CommunityAuthorizationContext(communityId)
            );

            if (!contextPermissions.Contains(Permission.UploadCommunityDocuments))
            {
                throw new InvalidOperationException("The user is not authorized to perform this command.");
            }

            Uri valetUrl = await _CommunitiesResource.GetCommunityDocumentUploadValetUrl(
                organizationId,
                locationId,
                communityId,
                documentId
            );

            return valetUrl;
        }

        IEnumerable<AtomicRecordsCommand> GenerateAtomicCommandsForCompositeCommand(CompositeRecordsCommand command)
        {
            switch (command)
            {
                case AddAdultToFamilyCommand c:
                {
                    ImmutableList<Address> addresses =
                        c.Address == null ? ImmutableList<Address>.Empty : ImmutableList<Address>.Empty.Add(c.Address);
                    ImmutableList<PhoneNumber> phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    ImmutableList<EmailAddress> emailAddresses =
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
                        new AddChildToFamily(c.FamilyId, c.PersonId, c.CustodialRelationships.ToImmutableList())
                    );
                    break;
                }
                case CreateVolunteerFamilyWithNewAdultCommand c:
                {
                    ImmutableList<Address> addresses =
                        c.Address == null ? ImmutableList<Address>.Empty : ImmutableList<Address>.Empty.Add(c.Address);
                    ImmutableList<PhoneNumber> phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    ImmutableList<EmailAddress> emailAddresses =
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
                    yield return new FamilyApprovalRecordsCommand(new ActivateVolunteerFamily(c.FamilyId));
                    break;
                }
                case CreatePartneringFamilyWithNewAdultCommand c:
                {
                    ImmutableList<Address> addresses =
                        c.Address == null ? ImmutableList<Address>.Empty : ImmutableList<Address>.Empty.Add(c.Address);
                    ImmutableList<PhoneNumber> phoneNumbers =
                        c.PhoneNumber == null
                            ? ImmutableList<PhoneNumber>.Empty
                            : ImmutableList<PhoneNumber>.Empty.Add(c.PhoneNumber);
                    ImmutableList<EmailAddress> emailAddresses =
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

        Task<bool> AuthorizeCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            return command switch
            {
                FamilyRecordsCommand c => _AuthorizationEngine.AuthorizeFamilyCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                PersonRecordsCommand c => _AuthorizationEngine.AuthorizePersonCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.FamilyId,
                    c.Command
                ),
                FamilyApprovalRecordsCommand c => _AuthorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                IndividualApprovalRecordsCommand c => _AuthorizationEngine.AuthorizeVolunteerCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                ReferralRecordsCommand c => _AuthorizationEngine.AuthorizeReferralCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                ArrangementRecordsCommand c => _AuthorizationEngine.AuthorizeArrangementsCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                NoteRecordsCommand c => _AuthorizationEngine.AuthorizeNoteCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                CommunityRecordsCommand c => _AuthorizationEngine.AuthorizeCommunityCommandAsync(
                    organizationId,
                    locationId,
                    user,
                    c.Command
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };
        }

        Task ExecuteCommandAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            return command switch
            {
                FamilyRecordsCommand c => _DirectoryResource.ExecuteFamilyCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                PersonRecordsCommand c => _DirectoryResource.ExecutePersonCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                FamilyApprovalRecordsCommand c => _ApprovalsResource.ExecuteVolunteerFamilyCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                IndividualApprovalRecordsCommand c => _ApprovalsResource.ExecuteVolunteerCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                ReferralRecordsCommand c => _ReferralsResource.ExecuteReferralCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                ArrangementRecordsCommand c => _ReferralsResource.ExecuteArrangementsCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                NoteRecordsCommand c => _NotesResource.ExecuteNoteCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                CommunityRecordsCommand c => _CommunitiesResource.ExecuteCommunityCommandAsync(
                    organizationId,
                    locationId,
                    c.Command,
                    user.UserId()
                ),
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };
        }

        async Task<RecordsAggregate?> RenderCommandResultAsync(
            Guid organizationId,
            Guid locationId,
            ClaimsPrincipal user,
            AtomicRecordsCommand command
        )
        {
            if (command is CommunityRecordsCommand c)
            {
                Guid communityId = c.Command.CommunityId;

                ImmutableList<Community> communities = await _CommunitiesResource.ListLocationCommunitiesAsync(
                    organizationId,
                    locationId
                );
                Community community = communities.Single(community => community.Id == communityId);

                CommunityInfo communityInfo = new(community, ImmutableList<Permission>.Empty);

                CommunityInfo communityResult = await _AuthorizationEngine.DiscloseCommunityAsync(
                    user,
                    organizationId,
                    locationId,
                    communityInfo
                );

                return new CommunityRecordsAggregate(communityResult);
            }

            Guid familyId = GetFamilyIdFromCommand(command);

            CombinedFamilyInfo? familyResult = await _CombinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(
                organizationId,
                locationId,
                familyId,
                user
            );

            return familyResult == null ? null : new FamilyRecordsAggregate(familyResult);
        }

        Guid GetFamilyIdFromCommand(AtomicRecordsCommand command)
        {
            return command switch
            {
                FamilyRecordsCommand c => c.Command.FamilyId,
                PersonRecordsCommand c => c.FamilyId,
                FamilyApprovalRecordsCommand c => c.Command.FamilyId,
                IndividualApprovalRecordsCommand c => c.Command.FamilyId,
                ReferralRecordsCommand c => c.Command.FamilyId,
                ArrangementRecordsCommand c => c.Command.FamilyId,
                NoteRecordsCommand c => c.Command.FamilyId,
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented."
                ),
            };
        }
    }
}
