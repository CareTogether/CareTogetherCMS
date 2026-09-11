using System;
using CareTogether.Resources.OrganizationApprovals;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class OrganizationApprovalModelTests
    {
        [TestMethod]
        public void RequirementCommandsOnlyChangeTheTargetOrganization()
        {
            var model = new OrganizationApprovalModel();
            var organizationId = Guid.NewGuid();
            var completionId = Guid.NewGuid();
            var (_, _, completed, commit) = model.ExecuteCommand(
                new CompleteOrganizationRequirement(
                    organizationId,
                    completionId,
                    "Application",
                    DateTime.UtcNow,
                    null,
                    null
                ),
                Guid.NewGuid(),
                DateTime.UtcNow
            );
            commit();

            Assert.AreEqual(1, completed.CompletedRequirements.Count);
            Assert.AreEqual(completionId, completed.CompletedRequirements[0].CompletedRequirementId);
            Assert.IsNull(model.TryGet(Guid.NewGuid()));

            var (_, _, incomplete, commitIncomplete) = model.ExecuteCommand(
                new MarkOrganizationRequirementIncomplete(
                    organizationId,
                    completionId,
                    "Application"
                ),
                Guid.NewGuid(),
                DateTime.UtcNow
            );
            commitIncomplete();

            Assert.AreEqual(0, incomplete.CompletedRequirements.Count);
        }
    }
}
