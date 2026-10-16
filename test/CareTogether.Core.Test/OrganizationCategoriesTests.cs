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
        public async Task CreateAndAssignCategories_RequiresConfiguredCategoryIds()
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
            var uncategorized = await communitiesResource.ExecuteCommunityCommandAsync(
                organizationId,
                locationId,
                new CreateCommunity(communityId, "Organization", ""),
                Guid.NewGuid()
            );

            Assert.AreEqual(0, uncategorized.CategoryIds.Count);
            var categorized = await communitiesResource.ExecuteCommunityCommandAsync(
                organizationId,
                locationId,
                new CreateCommunity(Guid.NewGuid(), "Categorized organization", "")
                {
                    CategoryIds = [category.Id],
                },
                Guid.NewGuid()
            );
            AssertEx.SequenceIs(categorized.CategoryIds, category.Id);
            foreach (var invalidIds in new[]
            {
                ImmutableList.Create(Guid.NewGuid()),
                ImmutableList.Create(category.Id, category.Id),
            })
            {
                await Assert.ThrowsExactlyAsync<InvalidOperationException>(() =>
                    communitiesResource.ExecuteCommunityCommandAsync(
                        organizationId,
                        locationId,
                        new CreateCommunity(Guid.NewGuid(), "Invalid categories", "")
                        {
                            CategoryIds = invalidIds,
                        },
                        Guid.NewGuid()
                    )
                );
            }

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

        [TestMethod]
        [DataRow(0)]
        [DataRow(1)]
        [DataRow(2)]
        public async Task CreateCategories_SurviveSerializationAndEventReplay(int categoryCount)
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var first = new OrganizationCategory(Guid.NewGuid(), "Housing");
            var second = new OrganizationCategory(Guid.NewGuid(), "Advocacy");
            var (store, policies) = await CreatePoliciesResourceAsync(organizationId, locationId, first);
            var configuration = await policies.GetConfigurationAsync(organizationId);
            await store.UpsertAsync(organizationId, Guid.Empty, "config", configuration with
            {
                OrganizationCategories = [first, second],
            });
            var ids = new[] { first.Id, second.Id }.Take(categoryCount).ToImmutableList();
            var command = new CreateCommunity(Guid.NewGuid(), "New organization", "")
            {
                CategoryIds = ids,
            };
            var json = Newtonsoft.Json.JsonConvert.SerializeObject(command);
            var received = Newtonsoft.Json.JsonConvert.DeserializeObject<CreateCommunity>(json)!;
            AssertEx.SequenceIs(received.CategoryIds!, ids.ToArray());

            var events = new List<CommunityCommandExecutedEvent>();
            var log = new Mock<IEventLog<CommunityCommandExecutedEvent>>();
            log.Setup(x => x.GetAllEventsAsync(organizationId, locationId))
                .Returns(() => ReplayCommunityEvents(events));
            log.Setup(x => x.AppendEventAsync(organizationId, locationId,
                    It.IsAny<CommunityCommandExecutedEvent>(), It.IsAny<long>()))
                .Callback<Guid, Guid, CommunityCommandExecutedEvent, long>((_, _, value, _) =>
                    events.Add(Newtonsoft.Json.JsonConvert.DeserializeObject<CommunityCommandExecutedEvent>(
                        Newtonsoft.Json.JsonConvert.SerializeObject(value))!))
                .Returns(Task.CompletedTask);
            var resource = new CommunitiesResource(log.Object, Mock.Of<IFileStore>(), policies);
            var created = await resource.ExecuteCommunityCommandAsync(organizationId, locationId, received, Guid.NewGuid());
            AssertEx.SequenceIs(created.CategoryIds, ids.ToArray());
            Assert.AreEqual(1, events.Count);
            var listed = await resource.ListLocationCommunitiesAsync(organizationId, locationId);
            AssertEx.SequenceIs(listed.Single().CategoryIds, ids.ToArray());

            var reloaded = new CommunitiesResource(log.Object, Mock.Of<IFileStore>(), policies);
            var reopened = await reloaded.FindCommunityAsync(organizationId, locationId, command.CommunityId);
            AssertEx.SequenceIs(reopened!.CategoryIds, ids.ToArray());
        }

        private static async IAsyncEnumerable<(CommunityCommandExecutedEvent DomainEvent, long SequenceNumber)>
            ReplayCommunityEvents(IEnumerable<CommunityCommandExecutedEvent> events)
        {
            await Task.CompletedTask;
            long sequence = 0;
            foreach (var value in events)
                yield return (value, sequence++);
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
