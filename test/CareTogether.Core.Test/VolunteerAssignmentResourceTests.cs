using System;
using System.Linq;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class VolunteerAssignmentResourceTests
    {
        private static readonly Guid UserId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );
        private static readonly Guid FamilyId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );
        private static readonly Guid RecordId = Guid.Parse(
            "33333333-3333-3333-3333-333333333333"
        );
        private static readonly Guid PersonId = Guid.Parse(
            "44444444-4444-4444-4444-444444444444"
        );

        [TestMethod]
        public void V1ReferralAssignedIndividualVolunteersAreActiveStateAndIdempotent()
        {
            var model = new V1ReferralModel();
            Commit(
                model.ExecuteReferralCommand(
                    new CreateV1Referral(RecordId, null, DateTime.UtcNow, "Referral", null),
                    UserId,
                    DateTime.UtcNow
                )
            );

            Commit(
                model.ExecuteReferralCommand(
                    new AssignIndividualVolunteerToV1Referral(RecordId, PersonId, "Intake Coordinator"),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteReferralCommand(
                    new AssignIndividualVolunteerToV1Referral(RecordId, PersonId, "Intake Coordinator"),
                    UserId,
                    DateTime.UtcNow
                )
            );

            var referral = model.GetReferral(RecordId)!;
            Assert.AreEqual(1, referral.AssignedIndividualVolunteers.Count);
            Assert.AreEqual(
                1,
                referral.History.OfType<V1ReferralIndividualVolunteerAssigned>().Count()
            );

            Commit(
                model.ExecuteReferralCommand(
                    new UnassignIndividualVolunteerFromV1Referral(RecordId, PersonId, "Intake Coordinator"),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteReferralCommand(
                    new UnassignIndividualVolunteerFromV1Referral(RecordId, PersonId, "Intake Coordinator"),
                    UserId,
                    DateTime.UtcNow
                )
            );

            referral = model.GetReferral(RecordId)!;
            Assert.AreEqual(0, referral.AssignedIndividualVolunteers.Count);
            Assert.AreEqual(
                1,
                referral.History.OfType<V1ReferralIndividualVolunteerUnassigned>().Count()
            );
        }

        [TestMethod]
        public void V1CaseAssignedIndividualVolunteersAreActiveStateAndIdempotent()
        {
            var model = new V1CaseModel();
            Commit(
                model.ExecuteV1CaseCommand(
                    new CreateReferral(FamilyId, RecordId, DateTime.UtcNow),
                    UserId,
                    DateTime.UtcNow
                )
            );

            Commit(
                model.ExecuteV1CaseCommand(
                    new AssignIndividualVolunteerToV1Case(FamilyId, RecordId, PersonId, "Case Manager"),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteV1CaseCommand(
                    new AssignIndividualVolunteerToV1Case(FamilyId, RecordId, PersonId, "Case Manager"),
                    UserId,
                    DateTime.UtcNow
                )
            );

            var v1Case = model.GetV1CaseEntry(RecordId);
            Assert.AreEqual(1, v1Case.AssignedIndividualVolunteers.Count);
            Assert.AreEqual(1, v1Case.History.OfType<V1CaseIndividualVolunteerAssigned>().Count());

            Commit(
                model.ExecuteV1CaseCommand(
                    new UnassignIndividualVolunteerFromV1Case(FamilyId, RecordId, PersonId, "Case Manager"),
                    UserId,
                    DateTime.UtcNow
                )
            );
            Commit(
                model.ExecuteV1CaseCommand(
                    new UnassignIndividualVolunteerFromV1Case(FamilyId, RecordId, PersonId, "Case Manager"),
                    UserId,
                    DateTime.UtcNow
                )
            );

            v1Case = model.GetV1CaseEntry(RecordId);
            Assert.AreEqual(0, v1Case.AssignedIndividualVolunteers.Count);
            Assert.AreEqual(1, v1Case.History.OfType<V1CaseIndividualVolunteerUnassigned>().Count());
        }

        private static void Commit<TEvent, TState>(
            (TEvent Event, long SequenceNumber, TState State, Action OnCommit) result
        ) => result.OnCommit();

        private static void Commit<TState>(
            (
                V1ReferralCommandExecuted Event,
                long SequenceNumber,
                TState Referral,
                Action OnCommit
            ) result
        ) => result.OnCommit();

        private static void Commit<TState>(
            (ReferralCommandExecuted Event, long SequenceNumber, TState V1CaseEntry, Action OnCommit)
                result
        ) => result.OnCommit();
    }
}
