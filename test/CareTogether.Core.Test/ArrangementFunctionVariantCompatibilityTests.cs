using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class ArrangementFunctionVariantCompatibilityTests
    {
        private static ArrangementFunctionVariant Empty() =>
            new("Profile", [], [], [], null, null, null);

        private static T RoundTrip<T>(T value) =>
            JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(value))!;

        private static readonly RecurrencePolicy Schedule = new DurationStagesRecurrencePolicy(
            [new(TimeSpan.FromHours(48), 1), new(TimeSpan.FromDays(7), null)]
        );

        private static ArrangementFunctionVariant Sources(bool legacy, bool newer) =>
            new(
                "Profile",
                legacy ? ["Legacy"] : [],
                legacy ? [new("Legacy", Schedule)] : [],
                legacy ? ["Legacy"] : [],
                newer ? [new("Newer", false)] : [],
                newer ? [new(new("Newer", false), Schedule)] : [],
                newer ? [new("Newer", false)] : []
            );

        [TestMethod]
        [DataRow(true, false)]
        [DataRow(false, true)]
        [DataRow(true, true)]
        [DataRow(false, false)]
        public void SourcesAreCombinedInOrderWithoutChangingFlags(bool legacy, bool newer)
        {
            var value = Sources(legacy, newer);
            var expected = (legacy ? new[] { new RequirementDefinition("Legacy", true) } : [])
                .Concat(newer ? [new RequirementDefinition("Newer", false)] : [])
                .ToArray();
            CollectionAssert.AreEqual(
                expected,
                value.RequiredSetupActionNames_PRE_MIGRATION.ToArray()
            );
            CollectionAssert.AreEqual(
                expected,
                value.RequiredCloseoutActionNames_PRE_MIGRATION.ToArray()
            );
            CollectionAssert.AreEqual(
                expected,
                value.RequiredMonitoringActions_PRE_MIGRATION.Select(x => x.Action).ToArray()
            );
            foreach (var item in value.RequiredMonitoringActions_PRE_MIGRATION)
                Assert.AreSame(Schedule, item.Recurrence);
            Assert.IsTrue(
                JToken.DeepEquals(JToken.FromObject(value), JToken.FromObject(RoundTrip(value)))
            );
        }

        [TestMethod]
        public void NullAndEmptyNewerCollectionsAreEquivalent()
        {
            var value = Empty();
            Assert.AreEqual(0, value.RequiredSetupActionNames_PRE_MIGRATION.Count);
            Assert.AreEqual(0, value.RequiredMonitoringActions_PRE_MIGRATION.Count);
            Assert.AreEqual(0, value.RequiredCloseoutActionNames_PRE_MIGRATION.Count);
            var explicitEmpty = value with
            {
                RequiredSetupActions = [],
                RequiredMonitoringActionsNew = [],
                RequiredCloseoutActions = [],
            };
            Assert.AreEqual(0, RoundTrip(explicitEmpty).RequiredSetupActionNames_PRE_MIGRATION.Count);
            Assert.AreEqual(0, RoundTrip(explicitEmpty).RequiredMonitoringActions_PRE_MIGRATION.Count);
            Assert.AreEqual(0, RoundTrip(explicitEmpty).RequiredCloseoutActionNames_PRE_MIGRATION.Count);
        }

        [TestMethod]
        public void WithUpdatesRecomputeAllPhasesAndPreserveDuplicates()
        {
            var original = Sources(true, true);
            var changed = original with
            {
                RequiredSetupActions = [new("Legacy", false), new("Added", true)],
                RequiredMonitoringActionsNew =
                [
                    new(new("Legacy", false), Schedule),
                    new(new("Added", true), Schedule),
                ],
                RequiredCloseoutActions = [new("Legacy", false), new("Added", true)],
            };
            var expected = new[]
            {
                new RequirementDefinition("Legacy", true),
                new("Legacy", false),
                new("Added", true),
            };
            CollectionAssert.AreEqual(
                expected,
                changed.RequiredSetupActionNames_PRE_MIGRATION.ToArray()
            );
            CollectionAssert.AreEqual(
                expected,
                changed.RequiredCloseoutActionNames_PRE_MIGRATION.ToArray()
            );
            CollectionAssert.AreEqual(
                expected,
                changed.RequiredMonitoringActions_PRE_MIGRATION.Select(x => x.Action).ToArray()
            );
            Assert.AreEqual("Newer", original.RequiredSetupActionNames_PRE_MIGRATION[1].ActionName);
        }

        [TestMethod]
        [DataRow(false, false)]
        [DataRow(true, false)]
        [DataRow(false, true)]
        [DataRow(true, true)]
        public void IncomingCompatibilityValuesCannotReplaceOrPopulateComputedCollections(
            bool compatibilityOnly,
            bool emptyCompatibility
        )
        {
            var expected = compatibilityOnly ? Empty() : Sources(true, true);
            var json = JObject.FromObject(expected);
            foreach (
                var name in new[]
                {
                    "RequiredSetupActionNames_PRE_MIGRATION",
                    "RequiredMonitoringActions_PRE_MIGRATION",
                    "RequiredCloseoutActionNames_PRE_MIGRATION",
                }
            )
                json[name] = emptyCompatibility ? new JArray()
                    : name.Contains("Monitoring")
                        ? JArray.FromObject(
                            new[] { new MonitoringRequirement(new("Injected", true), Schedule) }
                        )
                    : JArray.FromObject(new[] { new RequirementDefinition("Injected", true) });
            var actual = json.ToObject<ArrangementFunctionVariant>()!;
            for (var i = 0; i < 3; i++)
            {
                Assert.IsTrue(
                    JToken.DeepEquals(JToken.FromObject(expected), JToken.FromObject(actual))
                );
                actual = RoundTrip(actual);
            }
        }

        [TestMethod]
        public void ComputedPropertiesKeepTheirNamesAndRejectCamelCaseInput()
        {
            var settings = new JsonSerializerSettings
            {
                ContractResolver =
                    new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
            };
            var value = Sources(true, true);
            var json = JObject.Parse(JsonConvert.SerializeObject(value, settings));
            foreach (
                var name in new[]
                {
                    "RequiredSetupActionNames_PRE_MIGRATION",
                    "RequiredMonitoringActions_PRE_MIGRATION",
                    "RequiredCloseoutActionNames_PRE_MIGRATION",
                }
            )
            {
                Assert.IsFalse(typeof(ArrangementFunctionVariant).GetProperty(name)!.CanWrite);
                var camelName = char.ToLowerInvariant(name[0]) + name.Substring(1);
                Assert.IsNotNull(json[camelName]);
                json[camelName] = new JArray();
            }
            var actual = JsonConvert.DeserializeObject<ArrangementFunctionVariant>(
                json.ToString(),
                settings
            )!;
            Assert.IsTrue(JToken.DeepEquals(JToken.FromObject(value), JToken.FromObject(actual)));
        }

        [TestMethod]
        public void UpdatingCurrentSourcesPreservesHistoricalAndSiblingVariants()
        {
            var original = Sources(true, true);
            var sibling = Empty() with { VariantName = "Sibling" };
            var function = new ArrangementFunction(
                "Provider", FunctionRequirement.ExactlyOne, [], [], [], [original, sibling]
            );
            var arrangement = new ArrangementPolicy(
                "Arrangement", ChildInvolvement.NoChildInvolvement, [function], [], [], [],
                PolicyVersions:
                [
                    new(
                        "Historical", new DateTime(2024, 1, 1), ChildInvolvement.ChildHousing,
                        [function], [], [], []
                    ),
                ]
            );
            var before = JToken.FromObject(arrangement);
            var changed = arrangement with
            {
                ArrangementFunctions =
                [
                    function with
                    {
                        Variants =
                        [
                            original with { RequiredSetupActions = [new("Added", false)] },
                            sibling,
                        ],
                    },
                ],
            };
            var loaded = RoundTrip(changed);
            Assert.IsTrue(JToken.DeepEquals(before, JToken.FromObject(arrangement)));
            Assert.IsTrue(
                JToken.DeepEquals(
                    JToken.FromObject(arrangement.PolicyVersions!),
                    JToken.FromObject(loaded.PolicyVersions!)
                )
            );
            Assert.IsTrue(
                JToken.DeepEquals(
                    JToken.FromObject(sibling),
                    JToken.FromObject(loaded.ArrangementFunctions[0].Variants[1])
                )
            );
            Assert.AreEqual(
                "Added",
                loaded.ArrangementFunctions[0].Variants[0]
                    .RequiredSetupActionNames_PRE_MIGRATION[1].ActionName
            );
            Assert.AreEqual(
                "Newer",
                loaded.PolicyVersions![0].ArrangementFunctions[0].Variants[0]
                    .RequiredSetupActionNames_PRE_MIGRATION[1].ActionName
            );
        }

        [TestMethod]
        public void RecurrenceDiscriminatorsAndStageDetailsSurviveRepeatedRoundTrips()
        {
            RecurrencePolicy[] schedules =
            [
                Schedule,
                new DurationStagesPerChildLocationRecurrencePolicy(
                    [new(TimeSpan.FromHours(12), 2), new(TimeSpan.FromDays(14), null)]
                ),
                new OneTimeRecurrencePolicy(TimeSpan.FromTicks(1234567)),
                new ChildCareOccurrenceBasedRecurrencePolicy(TimeSpan.FromHours(9), 3, 1, false),
            ];
            var value = Empty() with
            {
                RequiredMonitoringActions = [new("Legacy", schedules[0])],
                RequiredMonitoringActionsNew = schedules
                    .Select((schedule, index) => new MonitoringRequirement(
                        new("Action " + index, index % 2 == 0), schedule
                    ))
                    .ToImmutableList(),
            };
            var expected = JToken.FromObject(value);
            for (var i = 0; i < 3; i++)
            {
                value = RoundTrip(value);
                Assert.IsTrue(JToken.DeepEquals(expected, JToken.FromObject(value)));
                Assert.IsTrue(
                    JToken.DeepEquals(
                        JToken.FromObject(schedules),
                        JToken.FromObject(
                            value.RequiredMonitoringActions_PRE_MIGRATION
                                .Skip(1).Select(x => x.Recurrence)
                        )
                    )
                );
            }
        }

        [TestMethod]
        [DataRow("Setup", false)]
        [DataRow("Setup", true)]
        [DataRow("Monitoring", false)]
        [DataRow("Monitoring", true)]
        [DataRow("Closeout", false)]
        [DataRow("Closeout", true)]
        public void SourceUpdatesReachAssignmentEvaluationAfterJsonRoundTrip(
            string phase,
            bool historical
        )
        {
            var recurrence = new OneTimeRecurrencePolicy(TimeSpan.FromDays(1));
            var original = Empty() with
            {
                RequiredSetupActions = [new("Changed", true)],
                RequiredMonitoringActionsNew = [new(new("Changed", true), recurrence)],
                RequiredCloseoutActions = [new("Changed", true)],
            };
            var changed = original with
            {
                RequiredSetupActions = [new("Changed", false), new("Added", true)],
                RequiredMonitoringActionsNew =
                [
                    new(new("Changed", false), recurrence),
                    new(new("Added", true), recurrence),
                ],
                RequiredCloseoutActions = [new("Changed", false), new("Added", true)],
            };
            var sibling = Sources(true, true) with { VariantName = "Sibling" };
            ArrangementFunction Function(
                string name, ImmutableList<ArrangementFunctionVariant> variants
            ) => new(name, FunctionRequirement.ZeroOrMore, [], [], [], variants);
            var functions = ImmutableList.Create(
                Function("Provider", [changed, sibling]), Function("Sibling function", [sibling])
            );
            var arrangement = new ArrangementPolicy(
                "Arrangement", ChildInvolvement.NoChildInvolvement, functions, [], [], [],
                [new("Base", true)], [new(new("Base", true), recurrence)], [new("Base", true)],
                PolicyVersions:
                [
                    new(
                        "Historical", new DateTime(2024, 1, 1),
                        ChildInvolvement.NoChildInvolvement, functions, [], [], [],
                        [new("Base", true)], [new(new("Base", true), recurrence)], [new("Base", true)]
                    ),
                ]
            );
            var untouched = JToken.FromObject(arrangement);
            arrangement = RoundTrip(arrangement);
            Assert.IsTrue(JToken.DeepEquals(untouched, JToken.FromObject(arrangement)));
            Assert.IsTrue(
                JToken.DeepEquals(
                    JToken.FromObject(sibling),
                    JToken.FromObject(arrangement.ArrangementFunctions[0].Variants[1])
                )
            );
            Assert.AreEqual("Sibling function", arrangement.ArrangementFunctions[1].FunctionName);
            var casePolicy = new V1CasePolicy([], [], [arrangement], []);
            var policy = new EffectiveLocationPolicy(
                ImmutableDictionary<string, ActionRequirement>.Empty, [], casePolicy,
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );
            var entry = new ArrangementEntry(
                "Arrangement", new DateOnly(2024, 1, 1), null, null, Guid.Empty, [], [],
                [new(Guid.NewGuid(), Guid.NewGuid(), "Provider", "Profile", [], [])],
                [new(Guid.NewGuid(), "Provider", "Profile", [], [])],
                [], historical ? "Historical" : null
            );
            var effective = V1CaseCalculations.GetArrangementPolicyForEvaluation(casePolicy, entry);
            var today = new DateOnly(2024, 2, 1);
            var result = phase switch
            {
                "Setup" => V1CaseCalculations.CalculateMissingSetupRequirements(
                    policy, effective, entry, today
                ),
                "Monitoring" => V1CaseCalculations.CalculateMissingMonitoringRequirements(
                    effective, entry, today
                ),
                _ => V1CaseCalculations.CalculateMissingCloseoutRequirements(
                    policy, effective, entry, today
                ),
            };
            Assert.AreEqual(5, result.Count);
            Assert.AreEqual(
                1,
                result.Count(x => x.Action.ActionName == "Base" && x.ArrangementFunction == null)
            );
            foreach (var individual in new[] { false, true })
            {
                var assignment = result
                    .Where(x => x.ArrangementFunction == "Provider" && x.PersonId.HasValue == individual)
                    .ToArray();
                Assert.AreEqual(2, assignment.Length);
                Assert.IsFalse(
                    assignment.Single(x => x.Action.ActionName == "Changed").Action.IsRequired
                );
                Assert.IsTrue(assignment.Single(x => x.Action.ActionName == "Added").Action.IsRequired);
            }
        }
    }
}
