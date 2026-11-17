using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.V1CaseCalculationTests
{
    [TestClass]
    public class CalculateV1CaseStatus
    {
        private static Guid Id(char x) =>
            Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));

        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        static V1CasePolicy v1CasePolicy = new V1CasePolicy(
            RequiredIntakeActionNames: [],
            CustomFields: ImmutableList<CustomField>.Empty,
            ArrangementPolicies: ImmutableList<ArrangementPolicy>
                .Empty.Add(
                    new ArrangementPolicy(
                        "Overnight Hosting",
                        ChildInvolvement.ChildHousing,
                        ImmutableList<ArrangementFunction>
                            .Empty.Add(
                                new ArrangementFunction(
                                    "Host Family",
                                    FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Parent Ally",
                                    FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Family Coach",
                                    FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Community Friend",
                                    FunctionRequirement.ZeroOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            ),
                        RequiredSetupActionNames: [],
                        RequiredMonitoringActions: [],
                        RequiredCloseoutActionNames: []
                    )
                )
                .Add(
                    new ArrangementPolicy(
                        "Daytime Hosting",
                        ChildInvolvement.DaytimeChildCareOnly,
                        ImmutableList<ArrangementFunction>
                            .Empty.Add(
                                new ArrangementFunction(
                                    "Host Family",
                                    FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Parent Ally",
                                    FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Family Coach",
                                    FunctionRequirement.OneOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Community Friend",
                                    FunctionRequirement.ZeroOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            ),
                        RequiredSetupActionNames: [],
                        RequiredMonitoringActions: [],
                        RequiredCloseoutActionNames: []
                    )
                )
                .Add(
                    new ArrangementPolicy(
                        "Friending",
                        ChildInvolvement.NoChildInvolvement,
                        ImmutableList<ArrangementFunction>
                            .Empty.Add(
                                new ArrangementFunction(
                                    "Parent Ally",
                                    FunctionRequirement.ExactlyOne,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            )
                            .Add(
                                new ArrangementFunction(
                                    "Community Friend",
                                    FunctionRequirement.ZeroOrMore,
                                    EligibleIndividualVolunteerRoles: Helpers.From(),
                                    EligibleVolunteerFamilyRoles: Helpers.From(),
                                    EligiblePeople: ImmutableList<Guid>.Empty,
                                    Variants: ImmutableList<ArrangementFunctionVariant>.Empty
                                )
                            ),
                        RequiredSetupActionNames: [],
                        RequiredMonitoringActions: [],
                        RequiredCloseoutActionNames: []
                    )
                ),
            ImmutableList<FunctionPolicy>.Empty
        );

        static Person adult1 = new Person(
            guid1,
            true,
            "Bob",
            "Smith",
            Gender.Male,
            new ExactAge(new DateTime(2000, 1, 1)),
            "",
            ImmutableList<Address>.Empty,
            null,
            ImmutableList<PhoneNumber>.Empty,
            null,
            ImmutableList<EmailAddress>.Empty,
            null,
            null,
            null
        );
        static Person adult2 = new Person(
            guid2,
            true,
            "Jane",
            "Smith",
            Gender.Female,
            new ExactAge(new DateTime(2000, 1, 1)),
            "",
            ImmutableList<Address>.Empty,
            null,
            ImmutableList<PhoneNumber>.Empty,
            null,
            ImmutableList<EmailAddress>.Empty,
            null,
            null,
            null
        );
        static Person inactiveAdult3 = new Person(
            guid3,
            false,
            "BobDUPLICATE",
            "Smith",
            Gender.Male,
            new ExactAge(new DateTime(2000, 1, 1)),
            "",
            ImmutableList<Address>.Empty,
            null,
            ImmutableList<PhoneNumber>.Empty,
            null,
            ImmutableList<EmailAddress>.Empty,
            null,
            null,
            null
        );
        static Person brotherNotInHousehold4 = new Person(
            guid2,
            true,
            "Eric",
            "Smith",
            Gender.Male,
            new ExactAge(new DateTime(2000, 1, 1)),
            "",
            ImmutableList<Address>.Empty,
            null,
            ImmutableList<PhoneNumber>.Empty,
            null,
            ImmutableList<EmailAddress>.Empty,
            null,
            null,
            null
        );
        static Person child5 = new Person(
            guid5,
            true,
            "Wanda",
            "Smith",
            Gender.Female,
            new ExactAge(new DateTime(2022, 1, 1)),
            "",
            ImmutableList<Address>.Empty,
            null,
            ImmutableList<PhoneNumber>.Empty,
            null,
            ImmutableList<EmailAddress>.Empty,
            null,
            null,
            null
        );

        static Family family = new Family(
            guid0,
            true,
            guid1,
            ImmutableList<(Person, FamilyAdultRelationshipInfo)>
                .Empty.Add((adult1, new FamilyAdultRelationshipInfo("Dad", true)))
                .Add(
                    (adult2, new FamilyAdultRelationshipInfo("Mom", true))
                )
            /*.Add((inactiveAdult3, new FamilyAdultRelationshipInfo("Dad", true))) //TODO: Reenable
            .Add((brotherNotInHousehold4, new FamilyAdultRelationshipInfo("Brother", false)))*/, //TODO: Reenable
            ImmutableList<Person>.Empty.Add(child5),
            ImmutableList<CustodialRelationship>
                .Empty.Add(
                    new CustodialRelationship(
                        guid5,
                        guid1,
                        CustodialRelationshipType.ParentWithCustody
                    )
                )
                .Add(
                    new CustodialRelationship(
                        guid5,
                        guid2,
                        CustodialRelationshipType.ParentWithCustody
                    )
                ),
            ImmutableList<UploadedDocumentInfo>.Empty,
            ImmutableList<Guid>.Empty,
            ImmutableList<CompletedCustomFieldInfo>.Empty,
            ImmutableList<Activity>.Empty,
            false
        );

        [TestMethod]
        public void ArrangementWithPolicyVersionUsesThatVersionForEvaluation()
        {
            var locationPolicy = new EffectiveLocationPolicy(
                ImmutableDictionary<string, ActionRequirement>.Empty,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    RequiredIntakeActionNames: [],
                    CustomFields: ImmutableList<CustomField>.Empty,
                    ArrangementPolicies:
                    [
                        new ArrangementPolicy(
                            ArrangementType: "Hosting",
                            ChildInvolvement: ChildInvolvement.ChildHousing,
                            ArrangementFunctions: [],
                            RequiredSetupActionNames: [],
                            RequiredMonitoringActions: [],
                            RequiredCloseoutActionNames: [],
                            PolicyVersions:
                            [
                                new ArrangementPolicyVersion(
                                    Version: "v1",
                                    SupersededAtUtc: null,
                                    ChildInvolvement: ChildInvolvement.ChildHousing,
                                    ArrangementFunctions: [],
                                    RequiredSetupActionNames: [],
                                    RequiredMonitoringActions: [],
                                    RequiredCloseoutActionNames: [],
                                    RequiredSetupActions:
                                    [
                                        new RequirementDefinition("Version 1 Setup", true),
                                    ],
                                    RequiredMonitoringActionsNew: [],
                                    RequiredCloseoutActions: []
                                ),
                                new ArrangementPolicyVersion(
                                    Version: "v2",
                                    SupersededAtUtc: null,
                                    ChildInvolvement: ChildInvolvement.ChildHousing,
                                    ArrangementFunctions: [],
                                    RequiredSetupActionNames: [],
                                    RequiredMonitoringActions: [],
                                    RequiredCloseoutActionNames: [],
                                    RequiredSetupActions:
                                    [
                                        new RequirementDefinition("Version 2 Setup", true),
                                    ],
                                    RequiredMonitoringActionsNew: [],
                                    RequiredCloseoutActions: []
                                ),
                            ]
                        ),
                    ],
                    FunctionPolicies: []
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var arrangementId = Guid.NewGuid();
            var result = CareTogether.Engines.PolicyEvaluation.V1CaseCalculations.CalculateV1CaseStatus(
                locationPolicy,
                locationPolicy.ReferralPolicy,
                new CareTogether.Engines.PolicyEvaluation.V1CaseEntry(
                    CompletedRequirements: [],
                    ExemptedRequirements: [],
                    CompletedCustomFields: ImmutableDictionary<
                        string,
                        CompletedCustomFieldInfo
                    >.Empty,
                    Arrangements: ImmutableDictionary<
                        Guid,
                        CareTogether.Engines.PolicyEvaluation.ArrangementEntry
                    >
                        .Empty.Add(
                            arrangementId,
                            new CareTogether.Engines.PolicyEvaluation.ArrangementEntry(
                                ArrangementType: "Hosting",
                                StartedAt: null,
                                EndedAt: null,
                                CancelledAt: null,
                                PartneringFamilyPersonId: Guid.NewGuid(),
                                CompletedRequirements: [],
                                ExemptedRequirements: [],
                                IndividualVolunteerAssignments: [],
                                FamilyVolunteerAssignments: [],
                                ChildLocationHistory: [],
                                ArrangementPolicyVersion: "v1"
                            )
                        )
                ),
                today: new DateOnly(2024, 1, 1)
            );

            AssertEx.SequenceIs(
                result.IndividualArrangements[arrangementId].MissingRequirements,
                new CareTogether.Engines.PolicyEvaluation.MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    new RequirementDefinition("Version 1 Setup", true),
                    null,
                    null
                )
            );
        }

        private static EffectiveLocationPolicy HostingOnlyLocationPolicy() =>
            new(
                ImmutableDictionary<string, ActionRequirement>.Empty,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    RequiredIntakeActionNames: [],
                    CustomFields: ImmutableList<CustomField>.Empty,
                    ArrangementPolicies:
                    [
                        new ArrangementPolicy(
                            ArrangementType: "Hosting",
                            ChildInvolvement: ChildInvolvement.ChildHousing,
                            ArrangementFunctions: [],
                            RequiredSetupActionNames: ["Hosting Setup"],
                            RequiredMonitoringActions: [],
                            RequiredCloseoutActionNames: []
                        ),
                    ],
                    FunctionPolicies: []
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

        private static CareTogether.Engines.PolicyEvaluation.V1CaseEntry CaseWithArrangement(
            Guid arrangementId,
            string arrangementType,
            string? arrangementPolicyVersion = null,
            DateOnly? startedAt = null
        ) =>
            new(
                CompletedRequirements: [],
                ExemptedRequirements: [],
                CompletedCustomFields: ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                Arrangements: ImmutableDictionary<
                    Guid,
                    CareTogether.Engines.PolicyEvaluation.ArrangementEntry
                >.Empty.Add(
                    arrangementId,
                    new CareTogether.Engines.PolicyEvaluation.ArrangementEntry(
                        ArrangementType: arrangementType,
                        StartedAt: startedAt,
                        EndedAt: null,
                        CancelledAt: null,
                        PartneringFamilyPersonId: Guid.NewGuid(),
                        CompletedRequirements: [],
                        ExemptedRequirements: [],
                        IndividualVolunteerAssignments: [],
                        FamilyVolunteerAssignments: [],
                        ChildLocationHistory: [],
                        ArrangementPolicyVersion: arrangementPolicyVersion
                    )
                )
            );

        [TestMethod]
        public void ArrangementWithTypeMissingFromPolicyIsEvaluatedWithoutRequirements()
        {
            var locationPolicy = HostingOnlyLocationPolicy();
            var arrangementId = Guid.NewGuid();
            var mismatches = new List<string>();

            var result = CareTogether.Engines.PolicyEvaluation.V1CaseCalculations.CalculateV1CaseStatus(
                locationPolicy,
                locationPolicy.ReferralPolicy,
                CaseWithArrangement(
                    arrangementId,
                    "Recurring Hosting",
                    startedAt: new DateOnly(2023, 12, 1)
                ),
                today: new DateOnly(2024, 1, 1),
                reportPolicyMismatch: mismatches.Add
            );

            var status = result.IndividualArrangements[arrangementId];
            Assert.AreEqual(
                CareTogether.Engines.PolicyEvaluation.ArrangementPhase.Started,
                status.Phase
            );
            Assert.IsEmpty(status.MissingRequirements);
            Assert.IsEmpty(status.MissingOptionalRequirements);
            Assert.HasCount(1, mismatches);
            StringAssert.Contains(mismatches[0], "Recurring Hosting");
        }

        [TestMethod]
        public void ArrangementWithTypeMissingFromPolicyDoesNotAffectOtherArrangements()
        {
            var locationPolicy = HostingOnlyLocationPolicy();
            var orphanedId = Guid.NewGuid();
            var hostingId = Guid.NewGuid();
            var v1Case = CaseWithArrangement(orphanedId, "Recurring Hosting");
            v1Case = v1Case with
            {
                Arrangements = v1Case.Arrangements.Add(
                    hostingId,
                    CaseWithArrangement(hostingId, "Hosting").Arrangements[hostingId]
                ),
            };

            var result = CareTogether.Engines.PolicyEvaluation.V1CaseCalculations.CalculateV1CaseStatus(
                locationPolicy,
                locationPolicy.ReferralPolicy,
                v1Case,
                today: new DateOnly(2024, 1, 1)
            );

            Assert.HasCount(2, result.IndividualArrangements);
            Assert.IsEmpty(result.IndividualArrangements[orphanedId].MissingRequirements);
            Assert.AreEqual(
                "Hosting Setup",
                result.IndividualArrangements[hostingId].MissingRequirements.Single().Action.ActionName
            );
        }

        [TestMethod]
        public void ArrangementWithMissingPolicyVersionUsesCurrentPolicy()
        {
            var locationPolicy = HostingOnlyLocationPolicy();
            var arrangementId = Guid.NewGuid();
            var mismatches = new List<string>();

            var result = CareTogether.Engines.PolicyEvaluation.V1CaseCalculations.CalculateV1CaseStatus(
                locationPolicy,
                locationPolicy.ReferralPolicy,
                CaseWithArrangement(arrangementId, "Hosting", arrangementPolicyVersion: "v9"),
                today: new DateOnly(2024, 1, 1),
                reportPolicyMismatch: mismatches.Add
            );

            Assert.AreEqual(
                "Hosting Setup",
                result.IndividualArrangements[arrangementId].MissingRequirements.Single().Action.ActionName
            );
            Assert.HasCount(1, mismatches);
            StringAssert.Contains(mismatches[0], "v9");
        }

        [TestMethod]
        public void Test()
        {
            Assert.Inconclusive("Not implemented");
        }
    }
}
