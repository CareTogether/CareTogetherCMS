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
        public async Task UpsertOrganizationConfigurationAsync_DoesNotPersistRenderedOrganizationAdministratorRole()
        {
            var organizationId = Guid.NewGuid();
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
                    ImmutableList<LocationConfiguration>.Empty,
                    ImmutableList<RoleDefinition>.Empty,
                    ImmutableList<string>.Empty,
                    null,
                    null
                )
            );

            var renderedConfiguration = await policiesResource.GetConfigurationAsync(
                organizationId
            );
            var updatedConfiguration = renderedConfiguration with
            {
                ReferralCloseReasons = ImmutableList.Create("Referral complete"),
                CaseCloseReasons = ImmutableList.Create("Case complete"),
            };

            var result = await policiesResource.UpsertOrganizationConfigurationAsync(
                organizationId,
                updatedConfiguration
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
                result.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            Assert.AreEqual(
                1,
                rerenderedConfiguration.Roles.Count(role =>
                    role.RoleName == SystemConstants.ORGANIZATION_ADMINISTRATOR
                )
            );
            AssertEx.SequenceIs(storedConfiguration.ReferralCloseReasons!, "Referral complete");
            AssertEx.SequenceIs(storedConfiguration.CaseCloseReasons!, "Case complete");
        }
    }
}
