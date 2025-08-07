using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingFunctionAssignments
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

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithNoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithOneVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                        guid1,
                        guid1,
                        "iA1+",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithTwoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid1,
                            guid1,
                            "iA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid2,
                            guid2,
                            "iA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithOneFamilyVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                        guid1,
                        "iA1+",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithTwoFamilyVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid1,
                            "iA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid2,
                            "iA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithNoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithOneVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                        guid1,
                        guid1,
                        "iA1",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithTwoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid1,
                            guid1,
                            "iA1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid2,
                            guid2,
                            "iA1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithOneFamilyVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                        guid1,
                        "iA1",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithTwoFamilyVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid1,
                            "iA1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid2,
                            "iA1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithNoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithOneVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                        guid1,
                        guid1,
                        "iA0+",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithTwoVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid1,
                            guid1,
                            "iA0+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid2,
                            guid2,
                            "iA0+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithOneFamilyVolunteer()
        {
            var role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty.Add(
                    new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                        guid1,
                        "iA0+",
                        null,
                        Helpers.Completed(),
                        Helpers.Exempted()
                    )
                ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithTwoFamilyVolunteers()
        {
            var role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid1,
                            "iA0+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid2,
                            "iA0+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityMultipleRolesMissing()
        {
            var role1 = Helpers.FunctionWithoutEligibility("fA1+", FunctionRequirement.OneOrMore);
            var role2 = Helpers.FunctionWithoutEligibility("iB1", FunctionRequirement.ExactlyOne);
            var role3 = Helpers.FunctionWithoutEligibility("iC1+", FunctionRequirement.OneOrMore);
            var role4 = Helpers.FunctionWithoutEligibility(
                "fAiBiC0+",
                FunctionRequirement.ZeroOrMore
            );

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>
                    .Empty.Add(role1)
                    .Add(role2)
                    .Add(role3)
                    .Add(role4),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role1, role2, role3);
        }

        [TestMethod]
        public void TestWithoutEligibilityMultipleRolesAssigned()
        {
            var role1 = Helpers.FunctionWithoutEligibility("fA1+", FunctionRequirement.OneOrMore);
            var role2 = Helpers.FunctionWithoutEligibility("iB1", FunctionRequirement.ExactlyOne);
            var role3 = Helpers.FunctionWithoutEligibility("iC1+", FunctionRequirement.OneOrMore);
            var role4 = Helpers.FunctionWithoutEligibility(
                "fAiBiC0+",
                FunctionRequirement.ZeroOrMore
            );

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>
                    .Empty.Add(role1)
                    .Add(role2)
                    .Add(role3)
                    .Add(role4),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid1,
                            "fA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid2,
                            "fA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid3,
                            guid3,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid4,
                            guid4,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid5,
                            guid5,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid6,
                            guid6,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithEligibilityMultipleRolesMissing()
        {
            var role1 = new ArrangementFunction(
                "fA1+",
                FunctionRequirement.OneOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From(),
                EligibleVolunteerFamilyRoles: Helpers.From("A"),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role2 = new ArrangementFunction(
                "iB1",
                FunctionRequirement.ExactlyOne,
                EligibleIndividualVolunteerRoles: Helpers.From("B"),
                EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role3 = new ArrangementFunction(
                "iC1+",
                FunctionRequirement.OneOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From("C"),
                EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role4 = new ArrangementFunction(
                "fAiBiC0+",
                FunctionRequirement.ZeroOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From("B", "C"),
                EligibleVolunteerFamilyRoles: Helpers.From("A"),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>
                    .Empty.Add(role1)
                    .Add(role2)
                    .Add(role3)
                    .Add(role4),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>.Empty,
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role1, role2, role3);
            Assert.Inconclusive("The calculation is not validating eligibility.");
        }

        [TestMethod]
        public void TestWithEligibilityMultipleRolesAssigned()
        {
            var role1 = new ArrangementFunction(
                "fA1+",
                FunctionRequirement.OneOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From(),
                EligibleVolunteerFamilyRoles: Helpers.From("A"),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role2 = new ArrangementFunction(
                "iB1",
                FunctionRequirement.ExactlyOne,
                EligibleIndividualVolunteerRoles: Helpers.From("B"),
                EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role3 = new ArrangementFunction(
                "iC1+",
                FunctionRequirement.OneOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From("C"),
                EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );
            var role4 = new ArrangementFunction(
                "fAiBiC0+",
                FunctionRequirement.ZeroOrMore,
                EligibleIndividualVolunteerRoles: Helpers.From("B", "C"),
                EligibleVolunteerFamilyRoles: Helpers.From("A"),
                EligiblePeople: ImmutableList<Guid>.Empty,
                Variants: ImmutableList<ArrangementFunctionVariant>.Empty
            );

            var result = V1CaseCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>
                    .Empty.Add(role1)
                    .Add(role2)
                    .Add(role3)
                    .Add(role4),
                ImmutableList<Engines.PolicyEvaluation.FamilyVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid1,
                            "fA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.FamilyVolunteerAssignment(
                            guid2,
                            "fA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    ),
                ImmutableList<Engines.PolicyEvaluation.IndividualVolunteerAssignment>
                    .Empty.Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid3,
                            guid3,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid4,
                            guid4,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid5,
                            guid5,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new Engines.PolicyEvaluation.IndividualVolunteerAssignment(
                            guid6,
                            guid6,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
            );

            AssertEx.SequenceIs(result);
            Assert.Inconclusive("The calculation is not validating eligibility.");
        }
    }
}
