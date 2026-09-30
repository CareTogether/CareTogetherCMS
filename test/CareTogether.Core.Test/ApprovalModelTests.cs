using System;
using System.Collections.Immutable;
using CareTogether.Resources.Approvals;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ApprovalModelTests
    {
        [TestMethod]
        public void CompletingVolunteerRequirementsUpdatesEachSelectedPerson()
        {
            var model = new ApprovalModel();
            var familyId = Guid.NewGuid();
            var firstPersonId = Guid.NewGuid();
            var secondPersonId = Guid.NewGuid();
            var completionId = Guid.NewGuid();
            var completedAtUtc = DateTime.UtcNow.AddDays(-1);

            var (_, _, completed, commit) = model.ExecuteVolunteerFamilyCommand(
                new CompleteVolunteerRequirements(
                    familyId,
                    ImmutableList.Create(firstPersonId, secondPersonId, firstPersonId),
                    completionId,
                    "Background Check",
                    completedAtUtc,
                    Guid.NewGuid(),
                    Guid.NewGuid()
                ),
                Guid.NewGuid(),
                DateTime.UtcNow
            );
            commit();

            Assert.AreEqual(0, completed.CompletedRequirements.Count);
            Assert.AreEqual(2, completed.IndividualEntries.Count);
            foreach (var personId in new[] { firstPersonId, secondPersonId })
            {
                var person = completed.IndividualEntries[personId];
                Assert.AreEqual(1, person.CompletedRequirements.Count);
                Assert.AreEqual(
                    completionId,
                    person.CompletedRequirements[0].CompletedRequirementId
                );
                Assert.AreEqual(
                    completedAtUtc,
                    person.CompletedRequirements[0].CompletedAtUtc
                );
            }
        }
    }
}
