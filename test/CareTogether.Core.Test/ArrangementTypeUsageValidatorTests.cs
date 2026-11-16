using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public class ArrangementTypeUsageValidatorTests
    {
        private static EffectiveLocationPolicy PolicyWith(params string[] arrangementTypes) =>
            new(
                ImmutableDictionary<string, ActionRequirement>.Empty,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    RequiredIntakeActionNames: [],
                    CustomFields: ImmutableList<CustomField>.Empty,
                    ArrangementPolicies: arrangementTypes
                        .Select(type => new ArrangementPolicy(
                            ArrangementType: type,
                            ChildInvolvement: ChildInvolvement.ChildHousing,
                            ArrangementFunctions: [],
                            RequiredSetupActionNames: [],
                            RequiredMonitoringActions: [],
                            RequiredCloseoutActionNames: []
                        ))
                        .ToImmutableList(),
                    FunctionPolicies: []
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

        private static IEnumerable<string> Repeat(string type, int count) =>
            Enumerable.Repeat(type, count);

        [TestMethod]
        public void RemovingAnArrangementTypeInUseIsAnError()
        {
            var result = ArrangementTypeUsageValidator.Validate(
                PolicyWith("Hosting", "Recurring Hosting"),
                PolicyWith("Hosting"),
                Repeat("Recurring Hosting", 9).Concat(Repeat("Hosting", 3))
            );

            CollectionAssert.AreEqual(
                new[]
                {
                    "The arrangement type 'Recurring Hosting' cannot be removed or renamed because 9 existing arrangements use it.",
                },
                result.Errors.ToArray()
            );
            Assert.IsEmpty(result.Warnings);
        }

        [TestMethod]
        public void RenamingAnArrangementTypeInUseIsAnError()
        {
            var result = ArrangementTypeUsageValidator.Validate(
                PolicyWith("Hosting"),
                PolicyWith("Overnight Hosting"),
                Repeat("Hosting", 1)
            );

            CollectionAssert.AreEqual(
                new[]
                {
                    "The arrangement type 'Hosting' cannot be removed or renamed because 1 existing arrangement uses it.",
                },
                result.Errors.ToArray()
            );
        }

        [TestMethod]
        public void RemovingAnUnusedArrangementTypeIsAllowed()
        {
            var result = ArrangementTypeUsageValidator.Validate(
                PolicyWith("Hosting", "Friending"),
                PolicyWith("Hosting"),
                Repeat("Hosting", 2)
            );

            Assert.IsEmpty(result.Errors);
            Assert.IsEmpty(result.Warnings);
        }

        [TestMethod]
        public void ArrangementTypeAlreadyMissingIsOnlyAWarning()
        {
            var result = ArrangementTypeUsageValidator.Validate(
                PolicyWith("Hosting"),
                PolicyWith("Hosting"),
                Repeat("Recurring Hosting", 2)
            );

            Assert.IsEmpty(result.Errors);
            CollectionAssert.AreEqual(
                new[]
                {
                    "2 existing arrangements use the arrangement type 'Recurring Hosting', which is not in the case policy. Add it back so their requirements are tracked.",
                },
                result.Warnings.ToArray()
            );
        }

        [TestMethod]
        public void RestoringAMissingArrangementTypeClearsTheWarning()
        {
            var result = ArrangementTypeUsageValidator.Validate(
                PolicyWith("Hosting"),
                PolicyWith("Hosting", "Recurring Hosting"),
                Repeat("Recurring Hosting", 2)
            );

            Assert.IsEmpty(result.Errors);
            Assert.IsEmpty(result.Warnings);
        }

        [TestMethod]
        public void MergeKeepsErrorsAndWarningsFromBothResults()
        {
            var merged = ArrangementTypeUsageValidator.Merge(
                new PolicyValidationResult(["a"], ["b"]),
                new PolicyValidationResult(["c"], ["d"])
            );

            CollectionAssert.AreEqual(new[] { "a", "c" }, merged.Errors.ToArray());
            CollectionAssert.AreEqual(new[] { "b", "d" }, merged.Warnings.ToArray());
        }
    }
}
