using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using CareTogether.Utilities.EventLog;
using CareTogether.Utilities.ObjectStore;

namespace CareTogether.Resources.Policies
{
    public sealed class PoliciesResource : IPoliciesResource
    {
        private const string CONFIG = "config";
        private const string POLICY = "policy";
        private const string SECRETS = "secrets";

        private readonly IObjectStore<OrganizationConfiguration> configurationStore;
        private readonly IObjectStore<EffectiveLocationPolicy> locationPoliciesStore;
        private readonly IObjectStore<OrganizationSecrets> organizationSecretsStore;
        private readonly IEventLog<PersonAccessEvent> personAccessEventLog;

        public PoliciesResource(
            IObjectStore<OrganizationConfiguration> configurationStore,
            IObjectStore<EffectiveLocationPolicy> locationPoliciesStore,
            IObjectStore<OrganizationSecrets> organizationSecretsStore,
            IEventLog<PersonAccessEvent> personAccessEventLog
        )
        {
            this.configurationStore = configurationStore;
            this.locationPoliciesStore = locationPoliciesStore;
            this.organizationSecretsStore = organizationSecretsStore;
            this.personAccessEventLog = personAccessEventLog;
        }

        public async Task<OrganizationConfiguration> GetConfigurationAsync(Guid organizationId)
        {
            var result = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            return Render(result);
        }

        public async Task<OrganizationConfiguration> UpsertRoleDefinitionAsync(
            Guid organizationId,
            string roleName,
            RoleDefinition role
        )
        {
            if (roleName == SystemConstants.ORGANIZATION_ADMINISTRATOR)
                throw new InvalidOperationException(
                    "The organization administrator role cannot be edited."
                );

            var config = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);
            var newConfig = config with
            {
                Roles = config.Roles.AddOrReplace(r => r.RoleName == roleName, _ => role),
            };
            await configurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);
            return Render(newConfig);
        }

        public async Task<OrganizationConfiguration> DeleteRoleDefinitionAsync(
            Guid organizationId,
            string roleName
        )
        {
            if (roleName == SystemConstants.ORGANIZATION_ADMINISTRATOR)
                throw new InvalidOperationException(
                    "The organization administrator role cannot be removed."
                );

            var config = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);

            var roleToRemove = config.Roles.SingleOrDefault(r => r.RoleName == roleName);

            if (roleToRemove == default)
                throw new InvalidOperationException($"Role '{roleName}' does not exist.");

            // Create the model every time we need it, to ensure we have the latest data
            // TODO: In V2, find a better way to deal with this
            var tenantModels = new ConcurrentLockingStore<
                (Guid organizationId, Guid locationId),
                PersonAccessModel
            >(async key =>
            {
                return await PersonAccessModel.InitializeAsync(
                    personAccessEventLog.GetAllEventsAsync(key.organizationId, key.locationId)
                );
            });

            // Check if any users have this role assigned
            foreach (var location in config.Locations)
            {
                using (
                    var lockedModel = await tenantModels.ReadLockItemAsync(
                        (organizationId, location.Id ?? Guid.Empty)
                    )
                )
                {
                    var usersWithRole = lockedModel.Value.FindAccess(entry =>
                        entry.Roles.Contains(roleName)
                    );

                    if (usersWithRole.Any())
                    {
                        throw new InvalidOperationException(
                            $"Cannot delete role '{roleName}' because it is currently assigned to {usersWithRole.Count} user(s) in location '{location.Name}'."
                        );
                    }
                }
            }

            var newConfig = config with { Roles = config.Roles.Remove(roleToRemove) };

            await configurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);

            return Render(newConfig);
        }

        public async Task<(
            OrganizationConfiguration OrganizationConfiguration,
            LocationConfiguration LocationConfiguration
        )> UpsertLocationDefinitionAsync(
            Guid organizationId,
            LocationConfiguration locationConfiguration
        )
        {
            var config = await configurationStore.GetAsync(organizationId, Guid.Empty, CONFIG);

            // If location id is empty, generate a new one
            if (locationConfiguration.Id == Guid.Empty)
                locationConfiguration = locationConfiguration with { Id = Guid.NewGuid() };

            // Generate IDs for AccessLevels that don't have them
            var updatedAccessLevels = locationConfiguration.AccessLevels?.Select(accessLevel =>
                accessLevel.Id == default
                    ? accessLevel with { Id = Guid.NewGuid() }
                    : accessLevel
            ).ToImmutableList() ?? ImmutableList<AccessLevel>.Empty;

            locationConfiguration = locationConfiguration with { AccessLevels = updatedAccessLevels };

            var newConfig = config with
            {
                Locations = config.Locations.AddOrReplace(
                    location => location.Id == locationConfiguration.Id,
                    _ => locationConfiguration
                ),
            };
            await configurationStore.UpsertAsync(organizationId, Guid.Empty, CONFIG, newConfig);
            return (Render(newConfig), locationConfiguration);
        }

        public async Task<EffectiveLocationPolicy> UpsertEffectiveLocationPolicyAsync(
            Guid organizationId,
            Guid locationId,
            EffectiveLocationPolicy effectiveLocationPolicy
        )
        {
            await locationPoliciesStore.UpsertAsync(
                organizationId,
                locationId,
                "policy",
                effectiveLocationPolicy
            );

            return effectiveLocationPolicy;
        }

        public async Task<EffectiveLocationPolicy> GetCurrentPolicy(
            Guid organizationId,
            Guid locationId
        )
        {
            var result = await locationPoliciesStore.GetAsync(organizationId, locationId, POLICY);

            var effectivePolicy = result with
            {
                ReferralPolicy = result.ReferralPolicy with
                {
                    ArrangementPolicies = result
                        .ReferralPolicy.ArrangementPolicies.Select(ap =>
                            ap with
                            {
                                ArrangementFunctions = ap
                                    .ArrangementFunctions.Select(af =>
                                        af with
                                        {
                                            EligibleIndividualVolunteerRoles =
                                                af.EligibleIndividualVolunteerRoles
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(
                                                        fp => fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligibleIndividualVolunteerRoles
                                                ?? [],
                                            EligibleVolunteerFamilyRoles =
                                                af.EligibleVolunteerFamilyRoles
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(
                                                        fp => fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligibleVolunteerFamilyRoles
                                                ?? [],
                                            EligiblePeople =
                                                af.EligiblePeople
                                                ?? result
                                                    .ReferralPolicy.FunctionPolicies?.SingleOrDefault(
                                                        fp => fp.FunctionName == af.FunctionName
                                                    )
                                                    ?.Eligibility.EligiblePeople
                                                ?? [],
                                        }
                                    )
                                    .ToImmutableList(),
                            }
                        )
                        .ToImmutableList(),
                },
            };

            return effectivePolicy;
        }

        public async Task<OrganizationSecrets> GetOrganizationSecretsAsync(Guid organizationId)
        {
            var result = await organizationSecretsStore.GetAsync(
                organizationId,
                Guid.Empty,
                SECRETS
            );
            return result;
        }

        private static readonly ImmutableList<string> DefaultReferralCloseReasons =
    ImmutableList.Create(
        "Not appropriate",
        "No capacity",
        "No longer needed",
        "Resourced",
        "Need met"
    );


        private OrganizationConfiguration Render(OrganizationConfiguration config) =>
            config with
            {
                // The 'OrganizationAdministrator' role for each organization is a specially-defined role
                // that always has *all* permissions granted to it. This ensures that administrators never
                // miss out on a newly defined permission that may not have been explicitly granted to
                // them in their organization's role configuration.
                Roles = config.Roles.Insert(
                    0,
                    new RoleDefinition(
                        SystemConstants.ORGANIZATION_ADMINISTRATOR,
                        IsProtected: true,
                        ImmutableList.Create(
                            new ContextualPermissionSet(
                                new GlobalPermissionContext(),
                                Enum.GetValues<Permission>().ToImmutableList()
                            )
                        )
                    )
                ),
            ReferralCloseReasons =
            config.ReferralCloseReasons
            ?? DefaultReferralCloseReasons,
            };
    }
}
