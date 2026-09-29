using System;
using CareTogether.Resources.V1Cases;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class ArrangementTypeChangeTests
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
        private static readonly Guid VolunteerFamilyId = Guid.Parse(
            "66666666-6666-6666-6666-666666666666"
        );

        [TestMethod]
        public void ChangesTypeAndPolicyVersionDuringSetup()
        {
            var model = CreateModelWithArrangement();

            Commit(
                model.ExecuteArrangementsCommand(
                    new ChangeArrangementType(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        "Childcare",
                        "2026"
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );

            var arrangement = model.GetV1CaseEntry(V1CaseId).Arrangements[ArrangementId];
            Assert.AreEqual("Childcare", arrangement.ArrangementType);
            Assert.AreEqual("2026", arrangement.ArrangementPolicyVersion);
        }

        [TestMethod]
        public void RejectsTypeChangeAfterArrangementStarts()
        {
            var model = CreateModelWithArrangement();
            Commit(
                model.ExecuteArrangementsCommand(
                    new StartArrangements(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        DateTime.UtcNow
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );

            Assert.ThrowsExactly<InvalidOperationException>(() => ChangeType(model));
        }

        [TestMethod]
        public void PreservesAssignmentsCompletionsAndExemptionsWhenTypeChanges()
        {
            var model = CreateModelWithArrangement();
            var completedRequirementId = Guid.NewGuid();
            Commit(
                model.ExecuteArrangementsCommand(
                    new CompleteArrangementRequirement(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        completedRequirementId,
                        "Background check",
                        DateTime.UtcNow,
                        null,
                        null
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteArrangementsCommand(
                    new ExemptArrangementRequirement(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        "Home inspection",
                        null,
                        "Not applicable",
                        null
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteArrangementsCommand(
                    new AssignVolunteerFamily(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        VolunteerFamilyId,
                        "Host Family",
                        null
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );

            ChangeType(model);

            var arrangement = model.GetV1CaseEntry(V1CaseId).Arrangements[ArrangementId];
            Assert.AreEqual("Childcare", arrangement.ArrangementType);
            Assert.AreEqual(1, arrangement.CompletedRequirements.Count);
            Assert.AreEqual(
                completedRequirementId,
                arrangement.CompletedRequirements[0].CompletedRequirementId
            );
            Assert.AreEqual(1, arrangement.ExemptedRequirements.Count);
            Assert.AreEqual("Home inspection", arrangement.ExemptedRequirements[0].RequirementName);
            Assert.AreEqual(1, arrangement.FamilyVolunteerAssignments.Count);
            Assert.AreEqual(
                VolunteerFamilyId,
                arrangement.FamilyVolunteerAssignments[0].FamilyId
            );
        }

        private static V1CaseModel CreateModelWithArrangement()
        {
            var model = new V1CaseModel();
            Commit(
                model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, V1CaseId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteArrangementsCommand(
                    new CreateArrangement(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        "Hosting",
                        DateTime.UtcNow,
                        PersonId,
                        null,
                        "2025"
                    ),
                    UserId,
                    DateTime.UtcNow
                )
            );
            return model;
        }

        private static void ChangeType(V1CaseModel model) =>
            Commit(
                model.ExecuteArrangementsCommand(
                    new ChangeArrangementType(
                        FamilyId,
                        V1CaseId,
                        [ArrangementId],
                        "Childcare",
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
