using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingCloseoutRequirements
    {
        public static ArrangementPolicy CloseoutRequirements(
            params (string ActionName, bool IsRequired)[] values
        ) =>
            new ArrangementPolicy(
                ArrangementType: string.Empty,
                ChildInvolvement: ChildInvolvement.ChildHousing,
                ArrangementFunctions: [],
                RequiredSetupActionNames: [],
                RequiredMonitoringActions: [],
                RequiredCloseoutActionNames: [],
                RequiredSetupActions: [],
                RequiredMonitoringActionsNew: [],
                RequiredCloseoutActions: values
                    .Select(value => new RequirementDefinition(value.ActionName, value.IsRequired))
                    .ToImmutableList()
            );

        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements(("A", true), ("B", true), ("C", true)),
                new Engines.PolicyEvaluation.ArrangementEntry(
                    "",
                    StartedAt: DateOnly.MinValue,
                    EndedAt: null,
                    CancelledAt: null,
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
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    new RequirementDefinition("A", true),
                    null,
                    null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    new RequirementDefinition("B", true),
                    null,
                    null
                ),
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    new RequirementDefinition("C", true),
                    null,
                    null
                )
            );
        }

        [TestMethod]
        public void TestPartialRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements(("A", true), ("B", true), ("C", true)),
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
                new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    new RequirementDefinition("C", true),
                    null,
                    null
                )
            );
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                CloseoutRequirements(("A", true), ("B", true), ("C", true)),
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
