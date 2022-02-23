using CareTogether.Engines;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateMissingCloseoutRequirements
    {
        [TestMethod]
        public void TestNoRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                Helpers.From("A", "B", "C"),
                Helpers.Completed(),
                Helpers.Exempted(),
                utcNow: new System.DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement("A", null, null),
                new MissingArrangementRequirement("B", null, null),
                new MissingArrangementRequirement("C", null, null));
        }

        [TestMethod]
        public void TestPartialRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                Helpers.From("A", "B", "C"),
                Helpers.Completed(("A", 1), ("A", 2), ("B", 3)),
                Helpers.Exempted(),
                utcNow: new System.DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result,
                new MissingArrangementRequirement("C", null, null));
        }

        [TestMethod]
        public void TestAllRequirementsCompleted()
        {
            var result = ReferralCalculations.CalculateMissingCloseoutRequirements(
                Helpers.From("A", "B", "C"),
                Helpers.Completed(("A", 1), ("A", 2), ("B", 3), ("C", 12)),
                Helpers.Exempted(),
                utcNow: new System.DateTime(2022, 2, 1));

            AssertEx.SequenceIs(result);
        }
    }
}
