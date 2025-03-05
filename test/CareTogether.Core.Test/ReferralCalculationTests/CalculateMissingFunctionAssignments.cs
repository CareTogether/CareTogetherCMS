using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingFunctionAssignments
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');
        static readonly Guid _Guid6 = Id('6');

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithNoVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithOneVolunteer()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty.Add(
                    new IndividualVolunteerAssignment(
                        _Guid1,
                        _Guid1,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>
                    .Empty.Add(
                        new IndividualVolunteerAssignment(
                            _Guid1,
                            _Guid1,
                            "iA1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid2,
                            _Guid2,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty.Add(
                    new FamilyVolunteerAssignment(_Guid1, "iA1+", null, Helpers.Completed(), Helpers.Exempted())
                ),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityOneOrMoreWithTwoFamilyVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1+", FunctionRequirement.OneOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>
                    .Empty.Add(
                        new FamilyVolunteerAssignment(_Guid1, "iA1+", null, Helpers.Completed(), Helpers.Exempted())
                    )
                    .Add(new FamilyVolunteerAssignment(_Guid2, "iA1+", null, Helpers.Completed(), Helpers.Exempted())),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithNoVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithOneVolunteer()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty.Add(
                    new IndividualVolunteerAssignment(
                        _Guid1,
                        _Guid1,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>
                    .Empty.Add(
                        new IndividualVolunteerAssignment(
                            _Guid1,
                            _Guid1,
                            "iA1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid2,
                            _Guid2,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty.Add(
                    new FamilyVolunteerAssignment(_Guid1, "iA1", null, Helpers.Completed(), Helpers.Exempted())
                ),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityExactlyOneWithTwoFamilyVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA1", FunctionRequirement.ExactlyOne);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>
                    .Empty.Add(
                        new FamilyVolunteerAssignment(_Guid1, "iA1", null, Helpers.Completed(), Helpers.Exempted())
                    )
                    .Add(new FamilyVolunteerAssignment(_Guid2, "iA1", null, Helpers.Completed(), Helpers.Exempted())),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithNoVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithOneVolunteer()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty.Add(
                    new IndividualVolunteerAssignment(
                        _Guid1,
                        _Guid1,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>
                    .Empty.Add(
                        new IndividualVolunteerAssignment(
                            _Guid1,
                            _Guid1,
                            "iA0+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid2,
                            _Guid2,
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
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>.Empty.Add(
                    new FamilyVolunteerAssignment(_Guid1, "iA0+", null, Helpers.Completed(), Helpers.Exempted())
                ),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityZeroOrMoreWithTwoFamilyVolunteers()
        {
            ArrangementFunction role = Helpers.FunctionWithoutEligibility("iA0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role),
                ImmutableList<FamilyVolunteerAssignment>
                    .Empty.Add(
                        new FamilyVolunteerAssignment(_Guid1, "iA0+", null, Helpers.Completed(), Helpers.Exempted())
                    )
                    .Add(new FamilyVolunteerAssignment(_Guid2, "iA0+", null, Helpers.Completed(), Helpers.Exempted())),
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result);
        }

        [TestMethod]
        public void TestWithoutEligibilityMultipleRolesMissing()
        {
            ArrangementFunction role1 = Helpers.FunctionWithoutEligibility("fA1+", FunctionRequirement.OneOrMore);
            ArrangementFunction role2 = Helpers.FunctionWithoutEligibility("iB1", FunctionRequirement.ExactlyOne);
            ArrangementFunction role3 = Helpers.FunctionWithoutEligibility("iC1+", FunctionRequirement.OneOrMore);
            ArrangementFunction role4 = Helpers.FunctionWithoutEligibility("fAiBiC0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role1).Add(role2).Add(role3).Add(role4),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role1, role2, role3);
        }

        [TestMethod]
        public void TestWithoutEligibilityMultipleRolesAssigned()
        {
            ArrangementFunction role1 = Helpers.FunctionWithoutEligibility("fA1+", FunctionRequirement.OneOrMore);
            ArrangementFunction role2 = Helpers.FunctionWithoutEligibility("iB1", FunctionRequirement.ExactlyOne);
            ArrangementFunction role3 = Helpers.FunctionWithoutEligibility("iC1+", FunctionRequirement.OneOrMore);
            ArrangementFunction role4 = Helpers.FunctionWithoutEligibility("fAiBiC0+", FunctionRequirement.ZeroOrMore);

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role1).Add(role2).Add(role3).Add(role4),
                ImmutableList<FamilyVolunteerAssignment>
                    .Empty.Add(
                        new FamilyVolunteerAssignment(_Guid1, "fA1+", null, Helpers.Completed(), Helpers.Exempted())
                    )
                    .Add(new FamilyVolunteerAssignment(_Guid2, "fA1+", null, Helpers.Completed(), Helpers.Exempted())),
                ImmutableList<IndividualVolunteerAssignment>
                    .Empty.Add(
                        new IndividualVolunteerAssignment(
                            _Guid3,
                            _Guid3,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid4,
                            _Guid4,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid5,
                            _Guid5,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid6,
                            _Guid6,
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
            ArrangementFunction role1 =
                new(
                    "fA1+",
                    FunctionRequirement.OneOrMore,
                    Helpers.From(),
                    Helpers.From("A"),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role2 =
                new(
                    "iB1",
                    FunctionRequirement.ExactlyOne,
                    Helpers.From("B"),
                    Helpers.From(),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role3 =
                new(
                    "iC1+",
                    FunctionRequirement.OneOrMore,
                    Helpers.From("C"),
                    Helpers.From(),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role4 =
                new(
                    "fAiBiC0+",
                    FunctionRequirement.ZeroOrMore,
                    Helpers.From("B", "C"),
                    Helpers.From("A"),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role1).Add(role2).Add(role3).Add(role4),
                ImmutableList<FamilyVolunteerAssignment>.Empty,
                ImmutableList<IndividualVolunteerAssignment>.Empty
            );

            AssertEx.SequenceIs(result, role1, role2, role3);
            Assert.Inconclusive("The calculation is not validating eligibility.");
        }

        [TestMethod]
        public void TestWithEligibilityMultipleRolesAssigned()
        {
            ArrangementFunction role1 =
                new(
                    "fA1+",
                    FunctionRequirement.OneOrMore,
                    Helpers.From(),
                    Helpers.From("A"),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role2 =
                new(
                    "iB1",
                    FunctionRequirement.ExactlyOne,
                    Helpers.From("B"),
                    Helpers.From(),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role3 =
                new(
                    "iC1+",
                    FunctionRequirement.OneOrMore,
                    Helpers.From("C"),
                    Helpers.From(),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );
            ArrangementFunction role4 =
                new(
                    "fAiBiC0+",
                    FunctionRequirement.ZeroOrMore,
                    Helpers.From("B", "C"),
                    Helpers.From("A"),
                    ImmutableList<Guid>.Empty,
                    ImmutableList<ArrangementFunctionVariant>.Empty
                );

            ImmutableList<ArrangementFunction> result = ReferralCalculations.CalculateMissingFunctionAssignments(
                ImmutableList<ArrangementFunction>.Empty.Add(role1).Add(role2).Add(role3).Add(role4),
                ImmutableList<FamilyVolunteerAssignment>
                    .Empty.Add(
                        new FamilyVolunteerAssignment(_Guid1, "fA1+", null, Helpers.Completed(), Helpers.Exempted())
                    )
                    .Add(new FamilyVolunteerAssignment(_Guid2, "fA1+", null, Helpers.Completed(), Helpers.Exempted())),
                ImmutableList<IndividualVolunteerAssignment>
                    .Empty.Add(
                        new IndividualVolunteerAssignment(
                            _Guid3,
                            _Guid3,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid4,
                            _Guid4,
                            "iB1",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid5,
                            _Guid5,
                            "iC1+",
                            null,
                            Helpers.Completed(),
                            Helpers.Exempted()
                        )
                    )
                    .Add(
                        new IndividualVolunteerAssignment(
                            _Guid6,
                            _Guid6,
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
