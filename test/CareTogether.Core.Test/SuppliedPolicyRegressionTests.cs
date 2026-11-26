using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Policies;
using CareTogether.Utilities.ObjectStore;
using Microsoft.Extensions.Caching.Memory;
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

        private static readonly (string Function, string[] UnknownRoles)[] UnknownRoleReferences =
        [
            ("Host Family or Friend", ["Parent Ally", "Family Coach", "Ministry Coordinator"]),
            ("Community Friend", ["Parent Ally", "Family Coach", "Ministry Coordinator"]),
            ("Parent Ally", ["Parent Ally"]),
            ("Family Coach", ["Family Coach"]),
            ("Community Coach", ["Parent Ally", "Family Coach"]),
            ("Ministry Coordinator", ["Ministry Coordinator"]),
            ("Community Champion", ["Parent Ally", "Family Coach", "Ministry Coordinator", "Community Champion"]),
        ];

        // Overnight Hosting functions that inherit from a Function Policy with unknown roles.
        private static readonly string[] OvernightHostingFunctions =
            ["Community Friend", "Parent Ally", "Family Coach", "Ministry Coordinator", "Community Champion"];

        private static string[] ExpectedWarnings() =>
            UnknownRoleReferences.SelectMany(row => row.UnknownRoles.Select(role =>
                $"Function Policy '{row.Function}' references unknown volunteer role '{role}'."
            )).Concat(OvernightHostingFunctions.SelectMany(function =>
                UnknownRoleReferences.Single(row => row.Function == function).UnknownRoles.Select(role =>
                    $"Arrangement Policy 'Overnight Hosting' function '{function}' references unknown volunteer role '{role}'."
                )
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

        [TestMethod]
        public async Task BlobObjectCacheReflectsWritesAndPreservesStoredValueAfterRejectedWrite()
        {
            var options = new BlobClientOptions(BlobClientOptions.ServiceVersion.V2021_10_04);
            options.Retry.MaxRetries = 0;
            var client = new BlobServiceClient("UseDevelopmentStorage=true", options);
            try
            {
                await client.GetPropertiesAsync();
            }
            catch (RequestFailedException ex) when (ex.Status == 0)
            {
                Assert.Inconclusive("Local Azurite Blob service is unavailable.");
            }

            using var cache = new MemoryCache(new MemoryCacheOptions());
            var store = new JsonBlobObjectStore<string>(
                client, "policies", cache, TimeSpan.FromMinutes(1)
            );
            var tenant = Guid.NewGuid();
            var location = Guid.NewGuid();
            var container = client.GetBlobContainerClient(tenant.ToString());
            try
            {
                await store.UpsertAsync(tenant, location, "policy", "original");
                Assert.AreEqual("original", await store.GetAsync(tenant, location, "policy"));
                await store.UpsertAsync(tenant, location, "policy", "updated");
                Assert.AreEqual("updated", await store.GetAsync(tenant, location, "policy"));

                var lease = container.GetBlobClient($"{location}/policies/policy.json")
                    .GetBlobLeaseClient();
                await lease.AcquireAsync(TimeSpan.FromSeconds(15));
                try
                {
                    await Assert.ThrowsExactlyAsync<RequestFailedException>(() =>
                        store.UpsertAsync(tenant, location, "policy", "rejected")
                    );
                    Assert.AreEqual("updated", await store.GetAsync(tenant, location, "policy"));
                }
                finally
                {
                    await lease.ReleaseAsync();
                }
            }
            finally
            {
                await container.DeleteIfExistsAsync();
            }
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
