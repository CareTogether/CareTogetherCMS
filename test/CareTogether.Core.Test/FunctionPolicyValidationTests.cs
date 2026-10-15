using System;
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
using CareTogether.Utilities.ObjectStore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class FunctionPolicyValidationTests
    {
        private static readonly OrganizationConfiguration Configuration =
            new("Test Org", [], [new RoleDefinition("Case Manager", false, [])], [], null, null);

        [TestMethod]
        public void UnsuffixedAndMissingIndividualRolesAreWarningsWithoutResolvingReferences()
        {
            var policy = WarningPolicy();
            var result = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            Assert.AreEqual(0, result.Errors.Count);
            CollectionAssert.AreEqual(
                new[] { "Parent Ally", "Family Coach", "Community Champion", "Ministry Coordinator" }
                    .Select(role =>
                        $"Function Policy 'Host Family or Friend' references unknown volunteer role '{role}'."
                    )
                    .ToArray(),
                result.Warnings.ToArray()
            );
        }

        [TestMethod]
        public void ArrangementFunctionsWarnAboutUnknownIndividualRolesTheyAreEligibleBy()
        {
            var policy = WithEligibility(
                WarningPolicy(),
                new FunctionEligibility(["Ministry Coordinator"], [], [])
            );
            policy = policy with
            {
                ReferralPolicy = policy.ReferralPolicy with
                {
                    ArrangementPolicies =
                    [
                        // Stored form: inherits the Function Policy roles.
                        Arrangement("Hosting", Function("Host Family or Friend", null)),
                        // Served form: GET /policy already copied the Function Policy roles in.
                        Arrangement("Day Hosting", Function("Host Family or Friend", ["Ministry Coordinator"])),
                        // Own roles replace the Function Policy roles.
                        Arrangement("Respite", Function("Host Family or Friend", ["Parent Ally [ASF]"])),
                        Arrangement("Mentoring", Function("Mentor", ["Parent Ally [ASF]", "Missing Mentor"])),
                    ],
                },
            };

            var result = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            CollectionAssert.AreEqual(
                new[]
                {
                    "Function Policy 'Host Family or Friend' references unknown volunteer role 'Ministry Coordinator'.",
                    "Arrangement Policy 'Hosting' function 'Host Family or Friend' references unknown volunteer role 'Ministry Coordinator'.",
                    "Arrangement Policy 'Day Hosting' function 'Host Family or Friend' references unknown volunteer role 'Ministry Coordinator'.",
                    "Arrangement Policy 'Mentoring' function 'Mentor' references unknown volunteer role 'Missing Mentor'.",
                },
                result.Warnings.ToArray()
            );
            Assert.AreEqual(0, result.Errors.Count);

            static ArrangementFunction Function(string name, ImmutableList<string>? roles) =>
                new(name, FunctionRequirement.ZeroOrMore, roles, null, null, []);

            static ArrangementPolicy Arrangement(string type, ArrangementFunction function) =>
                new(type, ChildInvolvement.NoChildInvolvement, [function], [], [], []);
        }

        [TestMethod]
        [DataRow("Parent Ally [ASF]")]
        [DataRow("parent ally [asf]")]
        public void KnownIndividualRolesHaveNoDiagnostics(string role)
        {
            var policy = WithEligibility(WarningPolicy(), new FunctionEligibility([role], [], []));
            var result = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            Assert.AreEqual(0, result.Errors.Count);
            Assert.AreEqual(0, result.Warnings.Count);
        }

        [TestMethod]
        public void BlankIndividualRolesAndUnknownFamilyRolesRemainErrors()
        {
            var policy = WithEligibility(
                PolicyValidationTests.ValidPolicy(),
                new FunctionEligibility([" "], ["Missing Family Role"], [])
            );
            var result = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            CollectionAssert.AreEqual(
                new[]
                {
                    "Function Policy 'Host Family or Friend' cannot contain a blank eligible volunteer role.",
                    "Function Policy 'Host Family or Friend' references unknown volunteer family role 'Missing Family Role'.",
                },
                result.Errors.ToArray()
            );
            Assert.AreEqual(0, result.Warnings.Count);
        }

        [TestMethod]
        [DataRow(false)]
        [DataRow(true)]
        public void FunctionAssignmentUnknownIndividualRolesAreWarnings(bool referral)
        {
            var policy = PolicyValidationTests.ValidPolicy();
            ImmutableList<FunctionAssignmentPolicy> assignments =
            [
                new FunctionAssignmentPolicy(
                    "Coordinator",
                    new FunctionAssignmentEligibility([], ["Missing Role"], [], [])
                ),
            ];
            policy = referral
                ? policy with { V1ReferralPolicy = new V1ReferralPolicy(assignments) }
                : policy with
                {
                    ReferralPolicy = policy.ReferralPolicy with
                    {
                        FunctionAssignmentPolicies = assignments,
                    },
                };
            var result = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            Assert.AreEqual(0, result.Errors.Count);
            Assert.AreEqual(1, result.Warnings.Count);
            StringAssert.Contains(
                result.Warnings[0],
                "references unknown volunteer role 'Missing Role'."
            );
        }

        [TestMethod]
        public async Task WarningOnlyPolicyPersistsAndSanitizesWithoutRenamingRoles()
        {
            var (resource, policyStore, organizationId) = await CreateResourceAsync();
            var policy = WarningPolicy();
            var eligibility = policy.ReferralPolicy.FunctionPolicies![0].Eligibility;
            policy = WithEligibility(policy, eligibility with { EligiblePeople = [Guid.Empty] });
            var locationId = Guid.NewGuid();

            var saved = await resource.UpsertEffectiveLocationPolicyAsync(
                organizationId,
                locationId,
                policy
            );
            var stored = await policyStore.GetAsync(organizationId, locationId, "policy");

            Assert.AreSame(saved, stored);
            Assert.AreEqual(
                0,
                stored.ReferralPolicy.FunctionPolicies![0].Eligibility.EligiblePeople.Count
            );
            CollectionAssert.AreEqual(
                eligibility.EligibleIndividualVolunteerRoles.ToArray(),
                stored.ReferralPolicy.FunctionPolicies[0].Eligibility.EligibleIndividualVolunteerRoles.ToArray()
            );
            Assert.AreEqual(
                4,
                (await resource.ValidateEffectiveLocationPolicyAsync(organizationId, saved)).Warnings.Count
            );
        }

        [TestMethod]
        public async Task BlockingErrorsPreventOverwriteEvenWithWarnings()
        {
            var (resource, policyStore, organizationId) = await CreateResourceAsync();
            var locationId = Guid.NewGuid();
            var original = PolicyValidationTests.ValidPolicy();
            await policyStore.UpsertAsync(organizationId, locationId, "policy", original);
            var policy = WarningPolicy();
            policy = policy with
            {
                ReferralPolicy = policy.ReferralPolicy with
                {
                    IntakeRequirements = [new RequirementDefinition("Unknown Action", true)],
                },
            };

            var exception = await Assert.ThrowsExactlyAsync<PolicyValidationException>(
                () => resource.UpsertEffectiveLocationPolicyAsync(organizationId, locationId, policy)
            );

            Assert.AreEqual(1, exception.Errors.Count);
            Assert.AreSame(
                original,
                await policyStore.GetAsync(organizationId, locationId, "policy")
            );
        }

        [TestMethod]
        public async Task ValidationEndpointReturnsErrorsAndWarningsWithoutAnyStoreWrites()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var configurationStore = new Mock<IObjectStore<OrganizationConfiguration>>(
                MockBehavior.Strict
            );
            configurationStore
                .Setup(x => x.GetAsync(organizationId, Guid.Empty, "config"))
                .ReturnsAsync(Configuration);
            var policyStore = new Mock<IObjectStore<EffectiveLocationPolicy>>(MockBehavior.Strict);
            var resource = new PoliciesResource(
                configurationStore.Object,
                policyStore.Object,
                new MemoryObjectStore<OrganizationSecrets>(),
                new MemoryEventLog<PersonAccessEvent>()
            );
            var authorization = Authorization(organizationId, locationId, true);
            var controller = Controller(resource, authorization.Object);
            var policy = WarningPolicy();
            policy = WithEligibility(
                policy,
                policy.ReferralPolicy.FunctionPolicies![0].Eligibility with
                {
                    EligiblePeople = [Guid.Empty],
                }
            );
            policy = policy with
            {
                ReferralPolicy = policy.ReferralPolicy with
                {
                    IntakeRequirements = [new RequirementDefinition("Unknown Action", true)],
                },
            };

            var response = await controller.ValidateEffectiveLocationPolicy(
                organizationId,
                locationId,
                policy
            );
            var ok = (OkObjectResult)response.Result!;
            var result = (PolicyValidationResult)ok.Value!;

            Assert.AreEqual(200, ok.StatusCode);
            Assert.AreEqual(1, result.Errors.Count);
            Assert.AreEqual(4, result.Warnings.Count);
            Assert.AreEqual(
                1,
                policy.ReferralPolicy.FunctionPolicies![0].Eligibility.EligiblePeople.Count
            );
            configurationStore.Verify(
                x => x.GetAsync(organizationId, Guid.Empty, "config"),
                Times.Once
            );
            configurationStore.VerifyNoOtherCalls();
            policyStore.VerifyNoOtherCalls();
            authorization.VerifyAll();
        }

        [TestMethod]
        public async Task UnauthorizedValidationDoesNotAccessPolicies()
        {
            var organizationId = Guid.NewGuid();
            var locationId = Guid.NewGuid();
            var policies = new Mock<IPoliciesResource>(MockBehavior.Strict);
            var authorization = Authorization(organizationId, locationId, false);
            var controller = Controller(policies.Object, authorization.Object);

            var response = await controller.ValidateEffectiveLocationPolicy(
                organizationId,
                locationId,
                WarningPolicy()
            );

            Assert.IsInstanceOfType<ForbidResult>(response.Result);
            policies.VerifyNoOtherCalls();
            authorization.VerifyAll();
        }

        [TestMethod]
        public async Task PutRetainsErrorResponseContract()
        {
            var (resource, _, organizationId) = await CreateResourceAsync();
            var locationId = Guid.NewGuid();
            var controller = Controller(
                resource,
                Authorization(organizationId, locationId, true).Object
            );
            var policy = WithEligibility(
                PolicyValidationTests.ValidPolicy(),
                new FunctionEligibility([" "], [], [])
            );

            var response = await controller.PutEffectiveLocationPolicy(
                organizationId,
                locationId,
                policy
            );
            var badRequest = (BadRequestObjectResult)response.Result!;
            var payload = Newtonsoft.Json.Linq.JObject.FromObject(badRequest.Value!);

            Assert.AreEqual(400, badRequest.StatusCode);
            Assert.AreEqual(1, payload.Properties().Count());
            Assert.AreEqual(
                "Function Policy 'Host Family or Friend' cannot contain a blank eligible volunteer role.",
                (string?)payload["errors"]![0]
            );
        }

        [TestMethod]
        public async Task PutRetainsSuccessfulPolicyResponseWithWarnings()
        {
            var (resource, _, organizationId) = await CreateResourceAsync();
            var locationId = Guid.NewGuid();
            var controller = Controller(
                resource,
                Authorization(organizationId, locationId, true).Object
            );

            var response = await controller.PutEffectiveLocationPolicy(
                organizationId,
                locationId,
                WarningPolicy()
            );
            var ok = (OkObjectResult)response.Result!;

            Assert.AreEqual(200, ok.StatusCode);
            Assert.IsInstanceOfType<EffectiveLocationPolicy>(ok.Value);
        }

        private static EffectiveLocationPolicy WarningPolicy()
        {
            var policy = PolicyValidationTests.ValidPolicy();
            string[] roles = ["Parent Ally [ASF]", "Family Coach [ASF]", "Community Champion [ASF]"];
            policy = policy with
            {
                VolunteerPolicy = policy.VolunteerPolicy with
                {
                    VolunteerRoles = roles.ToImmutableDictionary(
                        name => name,
                        name => new VolunteerRolePolicy(name, [])
                    ),
                },
            };
            return WithEligibility(
                policy,
                new FunctionEligibility(
                    ["Parent Ally", "Family Coach", "Community Champion", "Ministry Coordinator"],
                    [],
                    []
                )
            );
        }

        private static EffectiveLocationPolicy WithEligibility(
            EffectiveLocationPolicy policy,
            FunctionEligibility eligibility
        ) => policy with
        {
            ReferralPolicy = policy.ReferralPolicy with
            {
                FunctionPolicies = [new FunctionPolicy("Host Family or Friend", eligibility)],
            },
        };

        private static async Task<(
            PoliciesResource Resource,
            MemoryObjectStore<EffectiveLocationPolicy> Store,
            Guid OrganizationId
        )> CreateResourceAsync()
        {
            var organizationId = Guid.NewGuid();
            var configurationStore = new MemoryObjectStore<OrganizationConfiguration>();
            await configurationStore.UpsertAsync(organizationId, Guid.Empty, "config", Configuration);
            var policyStore = new MemoryObjectStore<EffectiveLocationPolicy>();
            return (
                new PoliciesResource(
                    configurationStore,
                    policyStore,
                    new MemoryObjectStore<OrganizationSecrets>(),
                    new MemoryEventLog<PersonAccessEvent>()
                ),
                policyStore,
                organizationId
            );
        }

        private static Mock<IAuthorizationEngine> Authorization(
            Guid organizationId,
            Guid locationId,
            bool allowed
        )
        {
            var authorization = new Mock<IAuthorizationEngine>(MockBehavior.Strict);
            authorization
                .Setup(x =>
                    x.AuthorizeLocationPolicyEditAsync(
                        organizationId,
                        locationId,
                        It.IsAny<SessionUserContext>()
                    )
                )
                .ReturnsAsync(allowed);
            return authorization;
        }

        private static ConfigurationController Controller(
            IPoliciesResource policies,
            IAuthorizationEngine authorization
        ) =>
            new(
                policies,
                Mock.Of<IDirectoryResource>(),
                Mock.Of<IAccountsResource>(),
                Mock.Of<IApprovalsResource>(),
                Mock.Of<IFeatureManager>(),
                authorization,
                Mock.Of<ICommunitiesResource>()
            )
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity()),
                    },
                },
            };
    }
}
