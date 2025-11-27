using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.V1CaseCalculationTests
{
    [TestClass]
    public class CalculateMissingSetupRequirements
    {
        private static readonly EffectiveLocationPolicy TestLocationPolicy =
            new EffectiveLocationPolicy(
                ImmutableDictionary<string, ActionRequirement>.Empty,
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
                )
            );

        private static readonly RequirementDefinition RequirementA = new RequirementDefinition(
            "A",
            true
        );
        private static readonly RequirementDefinition RequirementB = new RequirementDefinition(
            "B",
            true
        );
        private static readonly RequirementDefinition RequirementC = new RequirementDefinition(
            "C",
            true
        );

        public static ArrangementPolicy SetupRequirements(params (string, bool)[] values) =>
            new ArrangementPolicy(
                ArrangementType: string.Empty,
                ChildInvolvement: ChildInvolvement.ChildHousing,
                ArrangementFunctions: [],
                RequiredSetupActionNames: [],
                RequiredMonitoringActions: [],
                RequiredCloseoutActionNames: [],
                RequiredSetupActions: values
                    .Select(value => new RequirementDefinition(value.Item1, value.Item2))
                    .ToImmutableList(),
                RequiredMonitoringActionsNew: [],
                RequiredCloseoutActions: []
            );

        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            var result = V1CaseCalculations.CalculateMissingSetupRequirements(
                TestLocationPolicy,
                SetupRequirements(("A", true), ("B", true), ("C", true)),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, RequirementA, null, null),
                new MissingArrangementRequirement(null, null, null, null, RequirementB, null, null),
                new MissingArrangementRequirement(null, null, null, null, RequirementC, null, null)
            );
        }

        [TestMethod]
        public void TestPartialRequirementsCompleted()
        {
            var result = V1CaseCalculations.CalculateMissingSetupRequirements(
                TestLocationPolicy,
                SetupRequirements(("A", true), ("B", true), ("C", true)),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3)),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
            );

            AssertEx.SequenceIs(
                result,
                new MissingArrangementRequirement(null, null, null, null, RequirementC, null, null)
            );
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            var result = V1CaseCalculations.CalculateMissingSetupRequirements(
                TestLocationPolicy,
                SetupRequirements(("A", true), ("B", true), ("C", true)),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: null,
                    EndedAt: null,
                    null,
                    Guid.Empty,
                    Helpers.Completed(("A", 1), ("A", 2), ("B", 3), ("C", 12)),
                    Helpers.Exempted(),
                    ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty,
                    ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                    Helpers.ChildLocationHistory()
                ),
                today: new DateOnly(2022, 2, 1)
            );

            AssertEx.SequenceIs(result);
        }
    }
}
