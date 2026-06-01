using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class PoliciesResourceTests
    {
        [TestMethod]
        public async Task ConfigurationUpdates_MergeLocationAndOrganizationFieldsSeparately()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var location = new LocationConfiguration(
                locationId,
                "Original Location",
                ImmutableList.Create("Original ethnicity"),
                ImmutableList.Create("Original relationship"),
                ImmutableList.Create("Original arrangement reason"),
                ImmutableList<SourcePhoneNumberConfiguration>.Empty,
                ImmutableList<AccessLevel>.Empty
            );
            var role = new RoleDefinition(
                "Case Manager",
                null,
                ImmutableList<ContextualPermissionSet>.Empty
            );
            var configurationStore = new MemoryObjectStore<OrganizationConfiguration>();
            var policiesResource = new PoliciesResource(
                configurationStore,
                new MemoryObjectStore<EffectiveLocationPolicy>(),
                new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()
            );

            await configurationStore.UpsertAsync(
                organizationId,
                Guid.Empty,
                "config",
                new OrganizationConfiguration(
                    "Test Organization",
                    ImmutableList.Create(location),
                    ImmutableList.Create(role),
                    ImmutableList<string>.Empty,
                    ImmutableList.Create("Existing referral close reason"),
                    ImmutableList.Create("Existing case close reason")
                )
            );

            var renderedConfiguration = await policiesResource.GetConfigurationAsync(
                organizationId
            );
            var renderedLocation = renderedConfiguration.Locations.Single();
            var updatedLocation = renderedLocation with
            {
                Name = "Updated Location",
            };

            var result = await policiesResource.UpsertLocationDefinitionAsync(
                organizationId,
                updatedLocation
            );
            var storedLocationConfiguration = await configurationStore.GetAsync(
                organizationId,
                Guid.Empty,
                "config"
            );

            var updatedOrganizationConfiguration =
                await policiesResource.UpsertOrganizationConfigurationAsync(
                    organizationId,
                    ImmutableList.Create("Referral complete"),
                    ImmutableList.Create("Case complete")
                );
            var storedConfiguration = await configurationStore.GetAsync(
                organizationId,
                Guid.Empty,
                "config"
            );
            var rerenderedConfiguration = await policiesResource.GetConfigurationAsync(
                organizationId
            );

            Assert.AreEqual(
                0,
                storedConfiguration.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            Assert.AreEqual(
                1,
                result.OrganizationConfiguration.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            Assert.AreEqual(
                1,
                updatedOrganizationConfiguration.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            Assert.AreEqual(
                1,
                rerenderedConfiguration.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            AssertEx.SequenceIs(
                storedLocationConfiguration.ReferralCloseReasons!,
                "Existing referral close reason"
            );
            AssertEx.SequenceIs(
                storedLocationConfiguration.CaseCloseReasons!,
                "Existing case close reason"
            );
            AssertEx.SequenceIs(
                storedConfiguration.Roles.Select(role => role.RoleName).ToImmutableList(),
                "Case Manager"
            );
            Assert.AreEqual("Updated Location", storedConfiguration.Locations.Single().Name);
            AssertEx.SequenceIs(storedConfiguration.ReferralCloseReasons!, "Referral complete");
            AssertEx.SequenceIs(storedConfiguration.CaseCloseReasons!, "Case complete");
        }
    }
}
