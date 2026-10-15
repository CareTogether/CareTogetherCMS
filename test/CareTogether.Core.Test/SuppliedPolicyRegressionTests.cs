using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class SuppliedPolicyRegressionTests
    {
        private static readonly OrganizationConfiguration Configuration =
            new("Isolated policy regression", [], [], [], null, null);

        public TestContext TestContext { get; set; } = null!;

        private static EffectiveLocationPolicy Fixture() => ReadPolicy(
            Path.Combine(AppContext.BaseDirectory, "Fixtures", "asf-role-reference-policy.json")
        );

        private static EffectiveLocationPolicy ReadPolicy(string path) =>
            JsonConvert.DeserializeObject<EffectiveLocationPolicy>(File.ReadAllText(path))!;

        private static string[] References(EffectiveLocationPolicy policy) =>
            policy.ReferralPolicy.FunctionPolicies!
                .SelectMany(function => function.Eligibility.EligibleIndividualVolunteerRoles
                    .Select(role => $"{function.FunctionName}: {role}"))
                .ToArray();

        private static string[] ExpectedWarnings() => new[]
        {
            ("Host Family or Friend", new[] { "Parent Ally", "Family Coach", "Ministry Coordinator" }),
            ("Community Friend", new[] { "Parent Ally", "Family Coach", "Ministry Coordinator" }),
            ("Parent Ally", new[] { "Parent Ally" }),
            ("Family Coach", new[] { "Family Coach" }),
            ("Community Coach", new[] { "Parent Ally", "Family Coach" }),
            ("Ministry Coordinator", new[] { "Ministry Coordinator" }),
            ("Community Champion", new[] { "Parent Ally", "Family Coach", "Ministry Coordinator", "Community Champion" }),
        }.SelectMany(row => row.Item2.Select(role =>
            $"Function Policy '{row.Item1}' references unknown volunteer role '{role}'."
        )).ToArray();

        [TestMethod]
        public void MinimizedFixtureAndOptionalQaInputHaveTheSameWarnings()
        {
            var fixture = Fixture();
            var result = EffectiveLocationPolicyValidator.Validate(
                EffectiveLocationPolicySanitizer.Sanitize(fixture), Configuration
            );
            Assert.AreEqual(0, result.Errors.Count);
            CollectionAssert.AreEqual(ExpectedWarnings(), result.Warnings.ToArray());

            // Opt-in local QA inspection; the supplied file is never copied or modified.
            var qaPath = Environment.GetEnvironmentVariable("CARETOGETHER_QA_POLICY_PATH");
            if (string.IsNullOrEmpty(qaPath)) return;
            var supplied = ReadPolicy(qaPath);
            var suppliedResult = EffectiveLocationPolicyValidator.Validate(
                EffectiveLocationPolicySanitizer.Sanitize(supplied), Configuration
            );
            TestContext.WriteLine(JsonConvert.SerializeObject(suppliedResult));
            CollectionAssert.AreEqual(References(supplied), References(fixture));
            CollectionAssert.AreEqual(ExpectedWarnings(), suppliedResult.Warnings.ToArray());
            Assert.AreEqual(0, suppliedResult.Errors.Count, string.Join("\n", suppliedResult.Errors));
        }

        [TestMethod]
        public async Task AddingFunctionPersistsWithAllOriginalReferencesAndWarnings()
        {
            var (resource, store, organizationId, locationId) = await ResourceAsync();
            var original = Fixture();
            var arrangement = original.ReferralPolicy.ArrangementPolicies[0];
            var updated = original with
            {
                ReferralPolicy = original.ReferralPolicy with
                {
                    ArrangementPolicies = [arrangement with
                    {
                        ArrangementFunctions = arrangement.ArrangementFunctions.Add(
                            new ArrangementFunction("QA added function", FunctionRequirement.ZeroOrMore,
                                ["Community Friend"], [], [], [])
                        ),
                    }],
                },
            };

            await resource.UpsertEffectiveLocationPolicyAsync(organizationId, locationId, updated);
            var stored = await store.GetAsync(organizationId, locationId, "policy");
            var reloaded = await resource.GetCurrentPolicy(organizationId, locationId);
            var result = await resource.ValidateEffectiveLocationPolicyAsync(organizationId, stored);

            Assert.AreEqual(0, result.Errors.Count);
            CollectionAssert.AreEqual(ExpectedWarnings(), result.Warnings.ToArray());
            CollectionAssert.AreEqual(References(original), References(stored));
            Assert.IsTrue(reloaded.ReferralPolicy.ArrangementPolicies[0].ArrangementFunctions
                .Any(function => function.FunctionName == "QA added function"));
        }

        [TestMethod]
        public async Task GenuineBlockingErrorCannotOverwriteWarningOnlyPolicy()
        {
            var (resource, store, organizationId, locationId) = await ResourceAsync();
            var original = await resource.UpsertEffectiveLocationPolicyAsync(
                organizationId, locationId, Fixture()
            );
            var invalid = original with
            {
                ReferralPolicy = original.ReferralPolicy with
                {
                    IntakeRequirements = [new RequirementDefinition("QA missing action", true)],
                },
            };

            var error = await Assert.ThrowsExactlyAsync<PolicyValidationException>(() =>
                resource.UpsertEffectiveLocationPolicyAsync(organizationId, locationId, invalid)
            );

            CollectionAssert.AreEqual(new[] {
                "Case Policies Intake Requirements references unknown action 'QA missing action'."
            }, error.Errors.ToArray());
            Assert.AreSame(original, await store.GetAsync(organizationId, locationId, "policy"));
        }

        private static async Task<(
            PoliciesResource Resource, MemoryObjectStore<EffectiveLocationPolicy> Store,
            Guid OrganizationId, Guid LocationId
        )> ResourceAsync()
        {
            var organizationId = Guid.NewGuid();
            var config = new MemoryObjectStore<OrganizationConfiguration>();
            await config.UpsertAsync(organizationId, Guid.Empty, "config", Configuration);
            var store = new MemoryObjectStore<EffectiveLocationPolicy>();
            return (new PoliciesResource(config, store, new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()), store, organizationId, Guid.NewGuid());
        }
    }
}
