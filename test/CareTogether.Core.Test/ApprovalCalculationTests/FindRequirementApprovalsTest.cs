using CareTogether.Engines.PolicyEvaluation;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests;

[TestClass]
public class FindRequirementApprovalsTest
{
    [TestMethod]
    public void EmptyInputsReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([]),
            H.Exempted([])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void EmptyInputsWithSupersededDateReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", H.DT(20),
            H.Completed([]),
            H.Exempted([])
        );

        Assert.IsNull(result);
    }

    [TestMethod]
    public void NonMatchingInputsReturnsNull()
    {
        var result = SharedCalculations.FindRequirementApprovals(
            "A", null,
            H.Completed([("B", 2), ("C", 3)]),
            H.Exempted([("D", 4)])
        );

        Assert.IsNull(result);
    }
}
