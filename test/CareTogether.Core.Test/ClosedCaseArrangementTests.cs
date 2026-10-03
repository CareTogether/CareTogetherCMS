using System;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ClosedCaseArrangementTests
    {
        private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid FamilyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid CaseId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid ArrangementId = Guid.Parse(
            "44444444-4444-4444-4444-444444444444"
        );
        private static readonly Guid PersonId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        [TestMethod]
        public void AllowsCreatingAnArrangementForAnOpenOrReopenedCase()
        {
            var model = CreateOpenCase();
            CloseCase(model);
            Commit(
                model.ExecuteV1CaseCommand(
                    new ReopenReferral(FamilyId, CaseId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );

            CreateArrangement(model);

            Assert.IsTrue(model.GetV1CaseEntry(CaseId).Arrangements.ContainsKey(ArrangementId));
        }

        [TestMethod]
        public void RejectsCreatingAnInProgressArrangementForAClosedCase()
        {
            var model = CreateOpenCase();
            CloseCase(model);

            Assert.ThrowsExactly<InvalidOperationException>(() => CreateArrangement(model));
            Assert.AreEqual(0, model.GetV1CaseEntry(CaseId).Arrangements.Count);
        }

        [TestMethod]
        public void RejectsClosingACaseWithAnInProgressArrangement()
        {
            var model = CreateOpenCase();
            CreateArrangement(model);

            Assert.ThrowsExactly<InvalidOperationException>(() => CloseCase(model));
            Assert.IsNull(model.GetV1CaseEntry(CaseId).ClosedAtUtc);
        }

        [TestMethod]
        public void RejectsReopeningAnArrangementForAClosedCase()
        {
            var model = CreateOpenCase();
            CreateArrangement(model);
            Commit(
                model.ExecuteArrangementsCommand(
                    new EndArrangements(FamilyId, CaseId, [ArrangementId], DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );
            CloseCase(model);

            Assert.ThrowsExactly<InvalidOperationException>(() =>
                model.ExecuteArrangementsCommand(
                    new ReopenArrangements(FamilyId, CaseId, [ArrangementId], null),
                    UserId,
                    DateTime.UtcNow
                )
            );
        }

        [TestMethod]
        public async Task ReplaysLegacyClosedCaseWithOngoingArrangementAndAllowsEndingIt()
        {
            var timestamp = DateTime.UtcNow;
            var model = await V1CaseModel.InitializeAsync(
                new V1CaseEvent[]
                {
                    new ReferralCommandExecuted(
                        UserId,
                        timestamp,
                        new CreateReferral(FamilyId, CaseId, timestamp)
                    ),
                    new ArrangementsCommandExecuted(
                        UserId,
                        timestamp,
                        new CreateArrangement(
                            FamilyId,
                            CaseId,
                            [ArrangementId],
                            "Hosting",
                            timestamp,
                            PersonId,
                            null
                        )
                    ),
                    new ReferralCommandExecuted(
                        UserId,
                        timestamp,
                        new CloseReferralWithReason(FamilyId, CaseId, "Completed", timestamp)
                    ),
                }
                    .Select((domainEvent, index) => (domainEvent, (long)index))
                    .ToAsyncEnumerable()
            );

            var caseEntry = model.GetV1CaseEntry(CaseId);
            Assert.IsNotNull(caseEntry.ClosedAtUtc);
            Assert.IsNull(caseEntry.Arrangements[ArrangementId].EndedAtUtc);

            var editedRequestedAt = timestamp.AddDays(-1);
            Commit(
                model.ExecuteArrangementsCommand(
                    new EditArrangementRequestedAt(
                        FamilyId,
                        CaseId,
                        [ArrangementId],
                        editedRequestedAt
                    ),
                    UserId,
                    timestamp
                )
            );
            Assert.AreEqual(
                editedRequestedAt,
                model.GetV1CaseEntry(CaseId).Arrangements[ArrangementId].RequestedAtUtc
            );

            Commit(
                model.ExecuteArrangementsCommand(
                    new EndArrangements(FamilyId, CaseId, [ArrangementId], timestamp),
                    UserId,
                    timestamp
                )
            );

            Assert.AreEqual(
                timestamp,
                model.GetV1CaseEntry(CaseId).Arrangements[ArrangementId].EndedAtUtc
            );
        }

        [TestMethod]
        public async Task ReplaysLegacyArrangementCreatedAfterCaseWasClosed()
        {
            var timestamp = DateTime.UtcNow;
            var model = await V1CaseModel.InitializeAsync(
                new V1CaseEvent[]
                {
                    new ReferralCommandExecuted(
                        UserId,
                        timestamp,
                        new CreateReferral(FamilyId, CaseId, timestamp)
                    ),
                    new ReferralCommandExecuted(
                        UserId,
                        timestamp,
                        new CloseReferralWithReason(FamilyId, CaseId, "Completed", timestamp)
                    ),
                    new ArrangementsCommandExecuted(
                        UserId,
                        timestamp,
                        new CreateArrangement(
                            FamilyId,
                            CaseId,
                            [ArrangementId],
                            "Hosting",
                            timestamp,
                            PersonId,
                            null
                        )
                    ),
                }
                    .Select((domainEvent, index) => (domainEvent, (long)index))
                    .ToAsyncEnumerable()
            );

            Assert.IsNotNull(model.GetV1CaseEntry(CaseId).ClosedAtUtc);
            Assert.IsTrue(model.GetV1CaseEntry(CaseId).Arrangements.ContainsKey(ArrangementId));
        }

        private static V1CaseModel CreateOpenCase()
        {
            var model = new V1CaseModel();
            Commit(
                model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, CaseId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );
            return model;
        }

        private static void CloseCase(V1CaseModel model) =>
            Commit(
                model.ExecuteV1CaseCommand(
                    new CloseReferralWithReason(FamilyId, CaseId, "Completed", DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );

        private static void CreateArrangement(V1CaseModel model) =>
            Commit(
                model.ExecuteArrangementsCommand(
                    new CreateArrangement(
                        FamilyId,
                        CaseId,
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
