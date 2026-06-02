using System.Collections.Generic;
using System.Collections.Immutable;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class PolicyValidationTests
    {
        private static readonly OrganizationConfiguration Configuration =
            new("Test Org", [], [new RoleDefinition("Case Manager", false, [])], [], null);

        [TestMethod]
        public void ValidPolicyHasNoErrors()
        {
            var policy = ValidPolicy();

            var errors = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            Assert.AreEqual(0, errors.Count);
        }

        [TestMethod]
        public void UnknownRequirementActionIsRejected()
        {
            var policy = ValidPolicy() with
            {
                ReferralPolicy = ValidPolicy().ReferralPolicy with
                {
                    IntakeRequirements = [new RequirementDefinition("Unknown Action", true)],
                },
            };

            var errors = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            StringAssert.Contains(
                string.Join("\n", errors),
                "Case Policies Intake Requirements references unknown action 'Unknown Action'."
            );
        }

        [TestMethod]
        public void UnknownVolunteerRoleReferenceIsRejected()
        {
            var policy = ValidPolicy() with
            {
                V1ReferralPolicy = new V1ReferralPolicy(
                    [
                        new FunctionAssignmentPolicy(
                            "Referral Coordinator",
                            new FunctionAssignmentEligibility(
                                EligibleLocationRoles: [],
                                EligibleIndividualVolunteerRoles: ["Missing Role"],
                                EligibleVolunteerFamilyRoles: [],
                                EligiblePeople: []
                            )
                        ),
                    ]
                ),
            };

            var errors = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            StringAssert.Contains(
                string.Join("\n", errors),
                "Referral Policies Function Assignment Policies 'Referral Coordinator' references unknown volunteer role 'Missing Role'."
            );
        }

        [TestMethod]
        public void DuplicateCustomFieldNamesAreRejected()
        {
            var policy = ValidPolicy() with
            {
                CustomFamilyFields =
                [
                    new CustomField("Church", CustomFieldType.String, null, null),
                    new CustomField("church", CustomFieldType.String, null, null),
                ],
            };

            var errors = EffectiveLocationPolicyValidator.Validate(policy, Configuration);

            StringAssert.Contains(
                string.Join("\n", errors),
                "Custom Family Fields contains duplicate name 'church'."
            );
        }

        private static EffectiveLocationPolicy ValidPolicy() =>
            new(
                ActionDefinitions: ImmutableDictionary<string, ActionRequirement>.Empty.Add(
                    "Background Check",
                    new ActionRequirement(
                        DocumentLinkRequirement.None,
                        NoteEntryRequirement.None,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                    )
                ),
                CustomFamilyFields: [],
                ReferralPolicy: new V1CasePolicy(
                    RequiredIntakeActionNames: [],
                    CustomFields: [],
                    ArrangementPolicies: [],
                    FunctionPolicies: [],
                    IntakeRequirements: [new RequirementDefinition("Background Check", true)]
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    new Dictionary<string, VolunteerRolePolicy>
                    {
                        ["Family Friend"] = new VolunteerRolePolicy(
                            "Family Friend",
                            [
                                new VolunteerRolePolicyVersion(
                                    "v1",
                                    null,
                                    [
                                        new VolunteerApprovalRequirement(
                                            RequirementStage.Application,
                                            "Background Check"
                                        ),
                                    ]
                                ),
                            ]
                        ),
                    }.ToImmutableDictionary(),
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            )
            {
                V1ReferralPolicy = new V1ReferralPolicy(
                    [
                        new FunctionAssignmentPolicy(
                            "Referral Coordinator",
                            new FunctionAssignmentEligibility(
                                EligibleLocationRoles: ["Case Manager"],
                                EligibleIndividualVolunteerRoles: [],
                                EligibleVolunteerFamilyRoles: [],
                                EligiblePeople: []
                            )
                        ),
                    ]
                ),
            };
    }
}
