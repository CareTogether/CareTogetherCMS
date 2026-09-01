using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CareTogether.Api.Controllers;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.FileStore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class OrganizationCategoriesTests
    {
        [TestMethod]
        public async Task UpsertCategory_PreservesIdentityAndRequiresUniqueName()
        {
            var organizationId = Guid.NewGuid();
            var categoryId = Guid.NewGuid();
            var (configurationStore, policiesResource) = await CreatePoliciesResourceAsync(
                organizationId
            );

            await policiesResource.UpsertOrganizationCategoryAsync(
                organizationId,
                new OrganizationCategory(categoryId, "  Regional partner  ")
            );
            var renamed = await policiesResource.UpsertOrganizationCategoryAsync(
                organizationId,
                new OrganizationCategory(categoryId, "Community partner")
            );

            Assert.AreEqual(categoryId, renamed.OrganizationCategories.Single().Id);
            Assert.AreEqual("Community partner", renamed.OrganizationCategories.Single().Name);
            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() =>
                policiesResource.UpsertOrganizationCategoryAsync(
                    organizationId,
                    new OrganizationCategory(Guid.NewGuid(), "community PARTNER")
                )
            );

            var stored = await configurationStore.GetAsync(
                organizationId,
                Guid.Empty,
                "config"
            );
            Assert.AreEqual(categoryId, stored.OrganizationCategories.Single().Id);
        }

        [TestMethod]
        public async Task DeleteCategory_RejectsCategoryAssignedInAnyLocation()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var category = new OrganizationCategory(Guid.NewGuid(), "Regional partner");
            var (_, policiesResource) = await CreatePoliciesResourceAsync(
                organizationId,
                locationId,
                category
            );
            var communitiesResource = new Mock<ICommunitiesResource>();
            communitiesResource
                .Setup(resource =>
                    resource.ListLocationCommunitiesAsync(organizationId, locationId)
                )
                .ReturnsAsync(
                    [
                        new Community(
                            Guid.NewGuid(),
                            "Assigned organization",
                            "",
                            [],
                            [],
                            []
                        )
                        {
                            CategoryIds = [category.Id],
                        },
                    ]
                );
            var controller = new ConfigurationController(
                policiesResource,
                Mock.Of<IDirectoryResource>(),
                Mock.Of<IAccountsResource>(),
                Mock.Of<IApprovalsResource>(),
                Mock.Of<IFeatureManager>(),
                Mock.Of<IAuthorizationEngine>(),
                communitiesResource.Object
            )
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(
                            new ClaimsIdentity(
                                [
                                    new Claim(
                                        ClaimTypes.Role,
                                        SystemConstants.ORGANIZATION_ADMINISTRATOR
                                    ),
                                ],
                                "Test"
                            )
                        ),
                    },
                },
            };

            var exception = await Assert.ThrowsExactlyAsync<InvalidOperationException>(() =>
                controller.DeleteOrganizationCategory(organizationId, category.Id)
            );

            StringAssert.Contains(exception.Message, "assigned");
            var configuration = await policiesResource.GetConfigurationAsync(organizationId);
            Assert.AreEqual(category, configuration.OrganizationCategories.Single());
        }

        [TestMethod]
        public async Task AssignCategories_RequiresConfiguredCategoryIds()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var communityId = Guid.NewGuid();
            var category = new OrganizationCategory(Guid.NewGuid(), "Regional partner");
            var (_, policiesResource) = await CreatePoliciesResourceAsync(
                organizationId,
                locationId,
                category
            );
            var communitiesEventLog = new Mock<IEventLog<CommunityCommandExecutedEvent>>();
            communitiesEventLog
                .Setup(eventLog => eventLog.GetAllEventsAsync(organizationId, locationId))
                .Returns(EmptyCommunityEvents());
            communitiesEventLog
                .Setup(eventLog =>
                    eventLog.AppendEventAsync(
                        organizationId,
                        locationId,
                        It.IsAny<CommunityCommandExecutedEvent>(),
                        It.IsAny<long>()
                    )
                )
                .Returns(Task.CompletedTask);
            var communitiesResource = new CommunitiesResource(
                communitiesEventLog.Object,
                Mock.Of<IFileStore>(),
                policiesResource
            );
            await communitiesResource.ExecuteCommunityCommandAsync(
                organizationId,
                locationId,
                new CreateCommunity(communityId, "Organization", ""),
                Guid.NewGuid()
            );

            var updated = await communitiesResource.ExecuteCommunityCommandAsync(
                organizationId,
                locationId,
                new SetOrganizationCategories(communityId, [category.Id]),
                Guid.NewGuid()
            );

            AssertEx.SequenceIs(updated.CategoryIds, category.Id);
            await Assert.ThrowsExactlyAsync<InvalidOperationException>(() =>
                communitiesResource.ExecuteCommunityCommandAsync(
                    organizationId,
                    locationId,
                    new SetOrganizationCategories(communityId, [Guid.NewGuid()]),
                    Guid.NewGuid()
                )
            );
        }

        private static async IAsyncEnumerable<(
            CommunityCommandExecutedEvent DomainEvent,
            long SequenceNumber
        )> EmptyCommunityEvents()
        {
            await Task.CompletedTask;
            yield break;
        }

        private static async Task<(
            MemoryObjectStore<OrganizationConfiguration> ConfigurationStore,
            PoliciesResource PoliciesResource
        )> CreatePoliciesResourceAsync(
            Guid organizationId,
            Guid? locationId = null,
            OrganizationCategory? category = null
        )
        {
            var configurationStore = new MemoryObjectStore<OrganizationConfiguration>();
            var policiesResource = new PoliciesResource(
                configurationStore,
                new MemoryObjectStore<EffectiveLocationPolicy>(),
                new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()
            );
            var locations = locationId.HasValue
                ? ImmutableList.Create(
                    new LocationConfiguration(
                        locationId.Value,
                        "Location",
                        [],
                        [],
                        [],
                        [],
                        []
                    )
                )
                : [];
            await configurationStore.UpsertAsync(
                organizationId,
                Guid.Empty,
                "config",
                new OrganizationConfiguration("Tenant", locations, [], [], null, null)
                {
                    OrganizationCategories = category == null ? [] : [category],
                }
            );
            return (configurationStore, policiesResource);
        }
    }
}
