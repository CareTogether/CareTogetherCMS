using System;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class ArrangementPolicyCompatibilityTests
    {
        private static readonly RecurrencePolicy Once = new OneTimeRecurrencePolicy(TimeSpan.FromDays(1));

        private static T RoundTrip<T>(T value) =>
            JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(value))!;

        private static ArrangementPolicy Sources(bool required) => new(
            "Test arrangement", ChildInvolvement.NoChildInvolvement, [], [], [], [],
            [new("Changed", required)], [new(new("Changed", required), Once)],
            [new("Changed", required)]
        );

        private static ArrangementPolicy Edit(ArrangementPolicy value, bool required) => value with
        {
            RequiredSetupActions = [new("Changed", required)],
            RequiredMonitoringActionsNew = [new(new("Changed", required), value.RequiredMonitoringActionsNew![0].Recurrence)],
            RequiredCloseoutActions = [new("Changed", required)],
        };

        private static ImmutableList<RequirementDefinition> Effective(ArrangementPolicy value, string phase) =>
            phase switch
            {
                "Setup" => value.RequiredSetupActions_PRE_MIGRATION,
                "Monitoring" => value.RequiredMonitoringActions_PRE_MIGRATION.Select(item => item.Action).ToImmutableList(),
                _ => value.RequiredCloseoutActionNames_PRE_MIGRATION,
            };

        private static EffectiveLocationPolicy Policy(ArrangementPolicy arrangement) => new(
            new[] { "Changed", "Added", "Legacy", "Assignment" }.ToImmutableDictionary(
                name => name,
                _ => new ActionRequirement(0, 0, null, null, null, null, null, null)
            ),
            [], new V1CasePolicy([], [], [arrangement], []),
            new VolunteerPolicy(ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty)
        );

        private static ImmutableList<MissingArrangementRequirement> Evaluate(
            ArrangementPolicy arrangement, string phase, string? version = null
        )
        {
            var policy = Policy(arrangement);
            var entry = new ArrangementEntry(
                arrangement.ArrangementType, new DateOnly(2024, 1, 1), null, null,
                Guid.Empty, [], [],
                [new(Guid.NewGuid(), Guid.NewGuid(), "Provider", "Profile", [], [])],
                [new(Guid.NewGuid(), "Provider", "Profile", [], [])], [], version
            );
            var effective = V1CaseCalculations.GetArrangementPolicyForEvaluation(policy.ReferralPolicy, entry);
            var today = new DateOnly(2024, 2, 1);
            return phase switch
            {
                "Setup" => V1CaseCalculations.CalculateMissingSetupRequirements(policy, effective, entry, today),
                "Monitoring" => V1CaseCalculations.CalculateMissingMonitoringRequirements(effective, entry, today),
                _ => V1CaseCalculations.CalculateMissingCloseoutRequirements(policy, effective, entry, today),
            };
        }

        [TestMethod]
        [DataRow("Setup", false)]
        [DataRow("Setup", true)]
        [DataRow("Monitoring", false)]
        [DataRow("Monitoring", true)]
        [DataRow("Closeout", false)]
        [DataRow("Closeout", true)]
        public void RequirementFlagEditsReachEvaluationAfterRoundTrip(string phase, bool required)
        {
            var original = Sources(!required);
            var changed = Edit(original, required);
            var loaded = RoundTrip(changed);
            Assert.AreEqual(required, Evaluate(loaded, phase).Single().Action.IsRequired);
            Assert.AreEqual(required, Effective(changed, phase).Single().IsRequired);
            Assert.AreEqual(required, Effective(loaded, phase).Single().IsRequired);
            Assert.AreEqual(!required, Effective(original, phase).Single().IsRequired);
        }

        [TestMethod]
        public void AddRemoveAndMultiplePhasesRecomputeWithoutMutatingOriginal()
        {
            var original = Sources(true);
            var changed = original with
            {
                RequiredSetupActionNames = ["Legacy"],
                RequiredSetupActions = [new("Added", false), new("Legacy", false)],
                RequiredMonitoringActionsNew = [],
                RequiredCloseoutActions = [new("Changed", false), new("Added", true)],
            };
            var loaded = RoundTrip(changed);
            CollectionAssert.AreEqual(
                new[] { new RequirementDefinition("Legacy", true), new("Added", false), new("Legacy", false) },
                loaded.RequiredSetupActions_PRE_MIGRATION.ToArray()
            );
            Assert.AreEqual(0, loaded.RequiredMonitoringActions_PRE_MIGRATION.Count);
            Assert.AreEqual(0, Evaluate(loaded, "Monitoring").Count);
            CollectionAssert.AreEqual(
                new[] { "Changed", "Added" },
                Evaluate(loaded, "Closeout").Select(item => item.Action.ActionName).ToArray()
            );
            Assert.AreEqual("Changed", original.RequiredSetupActions_PRE_MIGRATION.Single().ActionName);
        }

        [TestMethod]
        public void LegacyOnlyAndNullOrEmptyNewerCollectionsPreserveRequiredContributions()
        {
            var value = new ArrangementPolicy(
                "Legacy arrangement", ChildInvolvement.NoChildInvolvement, [],
                ["Legacy"], [new("Legacy", Once)], ["Legacy"]
            );
            var json = JObject.FromObject(value);
            foreach (var name in CompatibilityNames) json.Remove(name);
            var legacy = json.ToObject<ArrangementPolicy>()!;
            foreach (var phase in Phases)
            {
                Assert.IsTrue(Effective(RoundTrip(legacy), phase).Single().IsRequired);
                Assert.AreEqual("Legacy", Evaluate(RoundTrip(legacy), phase).Single().Action.ActionName);
            }
            var explicitEmpty = legacy with
            {
                RequiredSetupActions = [],
                RequiredMonitoringActionsNew = [],
                RequiredCloseoutActions = [],
            };
            foreach (var phase in Phases)
                CollectionAssert.AreEqual(Effective(legacy, phase).ToArray(), Effective(RoundTrip(explicitEmpty), phase).ToArray());
        }

        private static readonly string[] Phases = ["Setup", "Monitoring", "Closeout"];
        private static readonly string[] CompatibilityNames =
        [
            "RequiredSetupActions_PRE_MIGRATION", "RequiredMonitoringActions_PRE_MIGRATION",
            "RequiredCloseoutActionNames_PRE_MIGRATION",
        ];

        [TestMethod]
        [DataRow(false)]
        [DataRow(true)]
        public void StaleOrCompatibilityOnlyJsonCannotReplaceComputedValues(bool compatibilityOnly)
        {
            var expected = compatibilityOnly ? Sources(true) with
            {
                RequiredSetupActions = [],
                RequiredMonitoringActionsNew = [],
                RequiredCloseoutActions = [],
            } : Sources(false);
            var stale = JObject.FromObject(Sources(true));
            var json = JObject.FromObject(expected);
            foreach (var name in CompatibilityNames) json[name] = stale[name]!.DeepClone();
            var loaded = json.ToObject<ArrangementPolicy>()!;
            for (var iteration = 0; iteration < 3; iteration++)
            {
                Assert.IsTrue(JToken.DeepEquals(JToken.FromObject(expected), JToken.FromObject(loaded)));
                loaded = RoundTrip(loaded);
            }
        }

        [TestMethod]
        public void GetterOnlyPropertiesKeepCamelCaseJsonNamesAndIgnoreEmptyIncomingMirrors()
        {
            var serializer = JsonSerializer.Create(new JsonSerializerSettings
            {
                ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
            });
            var original = Sources(true);
            var json = JObject.FromObject(original, serializer);
            foreach (var name in CompatibilityNames)
            {
                Assert.IsFalse(typeof(ArrangementPolicy).GetProperty(name)!.CanWrite);
                var camel = char.ToLowerInvariant(name[0]) + name.Substring(1);
                Assert.IsNotNull(json[camel]);
                json[camel] = new JArray();
            }
            Assert.IsTrue(JToken.DeepEquals(JToken.FromObject(original), JToken.FromObject(json.ToObject<ArrangementPolicy>(serializer)!)));
        }

        [TestMethod]
        public void AllRecurrenceStructuresAndStageOrderingSurviveRepeatedSerialization()
        {
            RecurrencePolicy[] schedules =
            [
                new OneTimeRecurrencePolicy(TimeSpan.FromTicks(1234567)),
                new DurationStagesRecurrencePolicy([new(TimeSpan.FromHours(48), 1), new(TimeSpan.FromDays(7), null)]),
                new DurationStagesPerChildLocationRecurrencePolicy([new(TimeSpan.FromHours(12), 2), new(TimeSpan.FromDays(14), null)]),
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(9), 3, 1, false),
            ];
            var value = Sources(true) with
            {
                RequiredMonitoringActions = [new("Legacy", schedules[0])],
                RequiredMonitoringActionsNew = schedules.Select((schedule, index) => new MonitoringRequirement(new("Action " + index, index % 2 == 0), schedule)).ToImmutableList(),
            };
            for (var index = 0; index < schedules.Length; index++)
                Assert.AreSame(schedules[index], value.RequiredMonitoringActions_PRE_MIGRATION[index + 1].Recurrence);
            var expected = JToken.FromObject(value);
            for (var iteration = 0; iteration < 3; iteration++)
            {
                value = RoundTrip(value);
                Assert.IsTrue(JToken.DeepEquals(expected, JToken.FromObject(value)));
            }
        }

        [TestMethod]
        public void HistoricalEvaluationUsesHistoricalSourcesAndPreservesSnapshotData()
        {
            var historical = new ArrangementPolicyVersion(
                "Past", new DateTime(2024, 1, 1), ChildInvolvement.NoChildInvolvement,
                [], ["Legacy"], [new("Legacy", Once)], ["Legacy"],
                [new("Changed", false)], [new(new("Changed", false), Once)], [new("Changed", false)]
            );
            var historicalJson = JObject.FromObject(historical);
            foreach (var name in CompatibilityNames) historicalJson[name] = new JArray();
            historical = historicalJson.ToObject<ArrangementPolicyVersion>()!;
            var original = Sources(true) with { PolicyVersions = [historical] };
            var loaded = RoundTrip(Edit(original, false));
            Assert.IsTrue(JToken.DeepEquals(JToken.FromObject(original.PolicyVersions!), JToken.FromObject(loaded.PolicyVersions!)));
            foreach (var phase in Phases)
            {
                var result = Evaluate(loaded, phase, "Past");
                CollectionAssert.AreEqual(new[] { "Legacy", "Changed" }, result.Select(item => item.Action.ActionName).ToArray());
                Assert.IsTrue(result[0].Action.IsRequired);
                Assert.IsFalse(result[1].Action.IsRequired);
            }
        }

        [TestMethod]
        public void BaseChangesRemainAdditiveToFamilyAndIndividualVariantRequirements()
        {
            var variant = new ArrangementFunctionVariant(
                "Profile", [], [], [], [new("Assignment", true)],
                [new(new("Assignment", true), Once)], [new("Assignment", true)]
            );
            var original = Sources(true) with
            {
                ArrangementFunctions = [new("Provider", FunctionRequirement.ZeroOrMore, [], [], [], [variant])],
            };
            var loaded = RoundTrip(Edit(original, false));
            Assert.IsTrue(JToken.DeepEquals(JToken.FromObject(original.ArrangementFunctions), JToken.FromObject(loaded.ArrangementFunctions)));
            foreach (var phase in Phases)
            {
                var result = Evaluate(loaded, phase);
                Assert.AreEqual(3, result.Count);
                Assert.IsFalse(result.Single(item => item.ArrangementFunction == null).Action.IsRequired);
                Assert.AreEqual(1, result.Count(item => item.ArrangementFunction == "Provider" && item.PersonId.HasValue && item.Action.IsRequired));
                Assert.AreEqual(1, result.Count(item => item.ArrangementFunction == "Provider" && !item.PersonId.HasValue && item.Action.IsRequired));
            }
        }

        [TestMethod]
        public async Task SuccessfulPolicySaveAndSerializedReloadEvaluateTheEditedSources()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var configStore = new MemoryObjectStore<OrganizationConfiguration>();
            var policyStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            await configStore.UpsertAsync(organizationId, Guid.Empty, "config", new("Synthetic", [], [], [], null, null));
            var resource = new PoliciesResource(configStore, policyStore, new MemoryObjectStore<OrganizationSecrets>(), new MemoryEventLog<PersonAccessEvent>());
            var candidate = Policy(Edit(Sources(true), false));
            await resource.UpsertEffectiveLocationPolicyAsync(organizationId, locationId, candidate);
            var loaded = RoundTrip(await policyStore.GetAsync(organizationId, locationId, "policy"));
            foreach (var phase in Phases)
                Assert.IsFalse(Evaluate(loaded.ReferralPolicy.ArrangementPolicies.Single(), phase).Single().Action.IsRequired);
        }

        [TestMethod]
        public void MinimizedPolicyFixtureStillDeserializesAndRoundTrips()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "asf-role-reference-policy.json");
            var policy = JsonConvert.DeserializeObject<EffectiveLocationPolicy>(File.ReadAllText(path))!;
            var loaded = RoundTrip(policy);
            foreach (var arrangement in loaded.ReferralPolicy.ArrangementPolicies)
                foreach (var phase in Phases) Assert.AreEqual(0, Effective(arrangement, phase).Count);
        }
    }
}
