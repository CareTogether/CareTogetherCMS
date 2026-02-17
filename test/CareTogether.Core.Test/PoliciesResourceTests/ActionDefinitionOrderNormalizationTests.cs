using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.PoliciesResourceTests
{
    [TestClass]
    public class ActionDefinitionOrderNormalizationTests
    {
        private static readonly Guid OrganizationId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid LocationId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );

        [TestMethod]
        public async Task UpsertNormalizesOrderFromDictionaryWhenMissingAndPersistsIt()
        {
            var policiesStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            var resource = CreatePoliciesResource(policiesStore);

            var policy = CreatePolicy(
                CreateActionDefinitions("Action C", "Action A", "Action B"),
                actionDefinitionOrder: null
            );

            var result = await resource.UpsertEffectiveLocationPolicyAsync(
                OrganizationId,
                LocationId,
                policy
            );

            var expectedOrder = policy.ActionDefinitions.Keys.ToArray();
            CollectionAssert.AreEqual(expectedOrder, result.ActionDefinitionOrder?.ToArray());

            var stored = await policiesStore.GetAsync(OrganizationId, LocationId, "policy");
            CollectionAssert.AreEqual(expectedOrder, stored.ActionDefinitionOrder?.ToArray());
        }

        [TestMethod]
        public async Task UpsertRemovesStaleAndDuplicateEntriesAndAppendsMissingActions()
        {
            var policiesStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            var resource = CreatePoliciesResource(policiesStore);

            var actionDefinitions = CreateActionDefinitions("Action A", "Action B", "Action C");
            var policy = CreatePolicy(
                actionDefinitions,
                ImmutableList.Create("Action B", "Missing", "Action B")
            );

            var result = await resource.UpsertEffectiveLocationPolicyAsync(
                OrganizationId,
                LocationId,
                policy
            );

            var expectedOrder = new List<string> { "Action B" };
            expectedOrder.AddRange(actionDefinitions.Keys.Where(actionName => actionName != "Action B"));

            CollectionAssert.AreEqual(expectedOrder.ToArray(), result.ActionDefinitionOrder?.ToArray());
            Assert.IsFalse(result.ActionDefinitionOrder?.Contains("Missing") ?? false);
            Assert.AreEqual(
                result.ActionDefinitionOrder?.Distinct().Count(),
                result.ActionDefinitionOrder?.Count
            );
        }

        [TestMethod]
        public async Task GetCurrentPolicyReturnsNormalizedOrderForLegacyPolicyWithoutPersistingOnRead()
        {
            var policiesStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            var resource = CreatePoliciesResource(policiesStore);

            var legacyPolicy = CreatePolicy(
                CreateActionDefinitions("Action 1", "Action 2", "Action 3"),
                actionDefinitionOrder: null
            );

            await policiesStore.UpsertAsync(OrganizationId, LocationId, "policy", legacyPolicy);

            var current = await resource.GetCurrentPolicy(OrganizationId, LocationId);
            var expectedOrder = legacyPolicy.ActionDefinitions.Keys.ToArray();

            CollectionAssert.AreEqual(expectedOrder, current.ActionDefinitionOrder?.ToArray());

            var storedAfterRead = await policiesStore.GetAsync(OrganizationId, LocationId, "policy");
            Assert.IsNull(storedAfterRead.ActionDefinitionOrder);
        }

        private static PoliciesResource CreatePoliciesResource(
            MemoryObjectStore<EffectiveLocationPolicy> policiesStore
        ) =>
            new PoliciesResource(
                new MemoryObjectStore<OrganizationConfiguration>(),
                policiesStore,
                new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()
            );

        private static ImmutableDictionary<string, ActionRequirement> CreateActionDefinitions(
            params string[] actionNames
        )
        {
            var builder = ImmutableDictionary.CreateBuilder<string, ActionRequirement>();
            foreach (var actionName in actionNames)
            {
                builder[actionName] = new ActionRequirement(
                    DocumentLinkRequirement.None,
                    NoteEntryRequirement.None,
                    Instructions: null,
                    InfoLink: null,
                    Validity: null,
                    CanView: null,
                    CanEdit: null,
                    AlternateNames: null
                );
            }

            return builder.ToImmutable();
        }

        private static EffectiveLocationPolicy CreatePolicy(
            ImmutableDictionary<string, ActionRequirement> actionDefinitions,
            ImmutableList<string>? actionDefinitionOrder
        ) =>
            new EffectiveLocationPolicy(
                actionDefinitions,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                ),
                actionDefinitionOrder
            );
    }
}
