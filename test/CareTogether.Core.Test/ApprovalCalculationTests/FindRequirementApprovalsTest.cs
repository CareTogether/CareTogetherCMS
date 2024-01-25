using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests;

[TestClass]
public class FindRequirementApprovalsTest
{
    [TestMethod]
    public void Foo()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.Exempted([])
        );

        Assert.Inconclusive("Not implemented!");
        Assert.IsNull(result);
        H.AssertDatesAre(result);
    }
}
