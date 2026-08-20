using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;

namespace CareTogether.Resources.Communities
{
    public sealed class CommunitiesResource : ICommunitiesResource
    {
        private readonly IEventLog<CommunityCommandExecutedEvent> communitiesEventLog;
        private readonly IFileStore fileStore;
        private readonly IPoliciesResource policiesResource;
        private readonly ConcurrentLockingStore<
            (Guid organizationId, Guid locationId),
            CommunitiesModel
        > tenantCommunitiesModels;

        public CommunitiesResource(
            IEventLog<CommunityCommandExecutedEvent> communitiesEventLog,
            IFileStore fileStore,
            IPoliciesResource policiesResource
        )
        {
            this.communitiesEventLog = communitiesEventLog;
            this.fileStore = fileStore;
            this.policiesResource = policiesResource;
            tenantCommunitiesModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                CommunitiesModel
            >(key =>
                CommunitiesModel.InitializeAsync(
                    communitiesEventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                )
            );
        }

        public async Task<Community> ExecuteCommunityCommandAsync(
            Guid organizationId,
            Guid locationId,
            CommunityCommand command,
            Guid userId
        )
        {
            if (command is SetOrganizationCategories setCategories)
                await ValidateOrganizationCategoriesAsync(
                    organizationId,
                    setCategories.CategoryIds
                );

            using (
                var lockedModel = await tenantCommunitiesModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.ExecuteCommunityCommand(
                    command,
                    userId,
                    DateTime.UtcNow
                );

                await communitiesEventLog.AppendEventAsync(
                    organizationId,
                    locationId,
                    result.Event,
                    result.SequenceNumber
                );
                result.OnCommit();
                return result.Community;
            }
        }

        private async Task ValidateOrganizationCategoriesAsync(
            Guid organizationId,
            ImmutableList<Guid> categoryIds
        )
        {
            if (categoryIds.Count != categoryIds.Distinct().Count())
                throw new InvalidOperationException(
                    "An organization category cannot be assigned more than once."
                );

            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            var configuredCategoryIds = configuration
                .OrganizationCategories.Select(category => category.Id)
                .ToImmutableHashSet();
            if (categoryIds.All(configuredCategoryIds.Contains))
                return;

            throw new InvalidOperationException(
                "One or more organization categories are not configured for this tenant."
            );
        }

        public async Task<ImmutableList<Community>> ListLocationCommunitiesAsync(
            Guid organizationId,
            Guid locationId
        )
        {
            using (
                var lockedModel = await tenantCommunitiesModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindCommunities(c => true);
            }
        }

        public async Task<Community?> FindCommunityAsync(
            Guid organizationId,
            Guid locationId,
            Guid communityId
        )
        {
            using (
                var lockedModel = await tenantCommunitiesModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                var result = lockedModel.Value.FindCommunities(f => f.Id == communityId);
                return result.SingleOrDefault();
            }
        }

        public async Task<Uri> GetCommunityDocumentReadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            var community = await FindCommunityAsync(organizationId, locationId, communityId);
            if (
                community == null
                || !community.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
            )
                throw new Exception("The specified organization document does not exist.");

            var documentSubpath = GetCommunityDocumentSubpath(communityId, documentId);

            var valetUrl = await fileStore.GetValetReadUrlAsync(
                organizationId,
                locationId,
                documentSubpath
            );

            return valetUrl;
        }

        public async Task<Uri> GetCommunityDocumentUploadValetUrl(
            Guid organizationId,
            Guid locationId,
            Guid communityId,
            Guid documentId
        )
        {
            var community = await FindCommunityAsync(organizationId, locationId, communityId);
            if (
                community == null
                || community.UploadedDocuments.Any(doc => doc.UploadedDocumentId == documentId)
            )
                throw new Exception("The specified organization document already exists.");

            var documentSubpath = GetCommunityDocumentSubpath(communityId, documentId);

            var valetUrl = await fileStore.GetValetCreateUrlAsync(
                organizationId,
                locationId,
                documentSubpath
            );

            return valetUrl;
        }

        private static string GetCommunityDocumentSubpath(Guid communityId, Guid documentId) =>
            // Build a concatenated path to ensure uploads for different communities stay separate
            $"community/{communityId}/{documentId}";
    }
}
