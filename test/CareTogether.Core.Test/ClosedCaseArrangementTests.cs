using System;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ClosedCaseArrangementTests
    {
        private static readonly Guid UserId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid FamilyId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );
        private static readonly Guid V1CaseId = Guid.Parse(
            "33333333-3333-3333-3333-333333333333"
        );
        private static readonly Guid ArrangementId = Guid.Parse(
            "44444444-4444-4444-4444-444444444444"
        );
        private static readonly Guid PersonId = Guid.Parse(
            "55555555-5555-5555-5555-555555555555"
        );

        [TestMethod]
        public void AllowsCreatingAnArrangementForAnOpenOrReopenedCase()
        {
            var model = CreateOpenCase();

            CloseCase(model);
            Commit(
                model.ExecuteV1CaseCommand(
                    new ReopenReferral(FamilyId, V1CaseId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );
            CreateArrangement(model);

            Assert.IsTrue(model.GetV1CaseEntry(V1CaseId).Arrangements.ContainsKey(ArrangementId));
        }

        [TestMethod]
        public void RejectsCreatingAnInProgressArrangementForAClosedCase()
        {
            var model = CreateOpenCase();
            CloseCase(model);

            Assert.ThrowsExactly<InvalidOperationException>(() => CreateArrangement(model));
            Assert.AreEqual(0, model.GetV1CaseEntry(V1CaseId).Arrangements.Count);
        }

        [TestMethod]
        public void RejectsClosingACaseWithAnInProgressArrangement()
        {
            var model = CreateOpenCase();
            CreateArrangement(model);

            Assert.ThrowsExactly<InvalidOperationException>(() => CloseCase(model));
            Assert.IsNull(model.GetV1CaseEntry(V1CaseId).ClosedAtUtc);
        }

        [TestMethod]
        public void RejectsReopeningAnArrangementForAClosedCase()
        {
            var model = CreateOpenCase();
            CreateArrangement(model);
            Commit(
                model.ExecuteArrangementsCommand(
                    new EndArrangements(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        DateTime.UtcNow
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );
            CloseCase(model);

            Assert.ThrowsExactly<InvalidOperationException>(() =>
                Commit(
                    model.ExecuteArrangementsCommand(
                        new ReopenArrangements(FamilyId, V1CaseId, [ArrangementId], null),
                        UserId,
                        DateTime.UtcNow
                    )
                )
            );
        }

        private static V1CaseModel CreateOpenCase()
        {
            var model = new V1CaseModel();
            Commit(
                model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, V1CaseId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );
            return model;
        }

        private static void CloseCase(V1CaseModel model) =>
            Commit(
                model.ExecuteV1CaseCommand(
                    new CloseReferralWithReason(FamilyId, V1CaseId, "Completed", DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );

        private static void CreateArrangement(V1CaseModel model) =>
            Commit(
                model.ExecuteArrangementsCommand(
                    new CreateArrangement(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        "Hosting",
                        DateTime.UtcNow,
                        PersonId,
                        null
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );

        private static void Commit<TEvent, TState>(
            (TEvent Event, long SequenceNumber, TState State, Action OnCommit) result
        ) => result.OnCommit();
    }
}
