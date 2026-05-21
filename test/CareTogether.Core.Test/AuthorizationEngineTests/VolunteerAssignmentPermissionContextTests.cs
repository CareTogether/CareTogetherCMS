using System;
using System.Collections.Immutable;
using CareTogether.Engines.Authorization;
using CareTogether.Resources;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.V1Cases;
using CareTogether.Resources.V1Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.AuthorizationEngineTests
{
    [TestClass]
    public sealed class VolunteerAssignmentPermissionContextTests
    {
        private static readonly Guid PersonId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid ReferralId = Guid.Parse(
            "22222222-2222-2222-2222-222222222222"
        );
        private static readonly Guid FamilyId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        [TestMethod]
        public void AssignedVolunteerInV1ReferralMatchesOpenReferralAndRole()
        {
            var permissionSet = new ContextualPermissionSet(
                new AssignedVolunteerInV1ReferralPermissionContext(
                    WhenReferralIsOpen: true,
                    WhenAssignmentRoleIsIn: ["Intake Coordinator"]
                ),
                [Permission.ViewV1Referral]
            );

            var result = UserAccessCalculation.IsPermissionSetApplicable(
                permissionSet,
                new V1ReferralAuthorizationContext(ReferralId),
                userFamily: null,
                targetFamily: null,
                targetFamilyIsVolunteerFamily: false,
                userFamilyV1Cases: [],
                targetFamilyV1Cases: [],
                assignedV1Cases: [],
                targetFamilyAssignedV1Cases: [],
                targetV1Referral: Referral(V1ReferralStatus.Open),
                userPersonId: PersonId,
                userFamilyCommunities: [],
                targetFamilyCommunities: [],
                userCommunityRoleAssignments: [],
                communities: []
            );

            Assert.IsTrue(result);
        }

        [TestMethod]
        public void AssignedVolunteerInV1ReferralOpenFilterRequiresExactlyOpenStatus()
        {
            var permissionSet = new ContextualPermissionSet(
                new AssignedVolunteerInV1ReferralPermissionContext(
                    WhenReferralIsOpen: true,
                    WhenAssignmentRoleIsIn: null
                ),
                [Permission.ViewV1Referral]
            );

            var result = UserAccessCalculation.IsPermissionSetApplicable(
                permissionSet,
                new V1ReferralAuthorizationContext(ReferralId),
                userFamily: null,
                targetFamily: null,
                targetFamilyIsVolunteerFamily: false,
                userFamilyV1Cases: [],
                targetFamilyV1Cases: [],
                assignedV1Cases: [],
                targetFamilyAssignedV1Cases: [],
                targetV1Referral: Referral(V1ReferralStatus.Accepted),
                userPersonId: PersonId,
                userFamilyCommunities: [],
                targetFamilyCommunities: [],
                userCommunityRoleAssignments: [],
                communities: []
            );

            Assert.IsFalse(result);
        }

        [TestMethod]
        public void AssignedVolunteerInV1CaseMatchesOpenCaseAndRoleThroughFamilyContext()
        {
            var permissionSet = new ContextualPermissionSet(
                new AssignedVolunteerInV1CasePermissionContext(
                    WhenCaseIsOpen: true,
                    WhenAssignmentRoleIsIn: ["Case Manager"]
                ),
                [Permission.ViewV1CaseProgress]
            );

            var result = UserAccessCalculation.IsPermissionSetApplicable(
                permissionSet,
                new FamilyAuthorizationContext(FamilyId),
                userFamily: null,
                targetFamily: Family(),
                targetFamilyIsVolunteerFamily: false,
                userFamilyV1Cases: [],
                targetFamilyV1Cases: [V1Case(closedAtUtc: null)],
                assignedV1Cases: [],
                targetFamilyAssignedV1Cases: [],
                targetV1Referral: null,
                userPersonId: PersonId,
                userFamilyCommunities: [],
                targetFamilyCommunities: [],
                userCommunityRoleAssignments: [],
                communities: []
            );

            Assert.IsTrue(result);
        }

        private static V1Referral Referral(V1ReferralStatus status) =>
            new(
                ReferralId,
                FamilyId,
                DateTime.UtcNow,
                "Referral",
                status,
                Comment: null,
                AcceptedAtUtc: null,
                ClosedAtUtc: null,
                CloseReason: null,
                CompletedCustomFields: ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                CompletedRequirements: [],
                ExemptedRequirements: [],
                UploadedDocuments: [],
                DeletedDocuments: [],
                AssignedIndividualVolunteers:
                [
                    new AssignedIndividualVolunteer(
                        PersonId,
                        "Intake Coordinator",
                        DateTime.UtcNow,
                        PersonId
                    ),
                ],
                History: [],
                Notes: []
            );

        private static V1CaseEntry V1Case(DateTime? closedAtUtc) =>
            new(
                ReferralId,
                FamilyId,
                LinkedV1ReferralIds: [],
                OpenedAtUtc: DateTime.UtcNow,
                ClosedAtUtc: closedAtUtc,
                CloseReason: null,
                CompletedRequirements: [],
                ExemptedRequirements: [],
                CompletedCustomFields: ImmutableDictionary<string, CompletedCustomFieldInfo>.Empty,
                Arrangements: ImmutableDictionary<Guid, ArrangementEntry>.Empty,
                AssignedIndividualVolunteers:
                [
                    new AssignedIndividualVolunteer(
                        PersonId,
                        "Case Manager",
                        DateTime.UtcNow,
                        PersonId
                    ),
                ],
                History: [],
                Comments: null
            );

        private static Family Family() =>
            new(
                FamilyId,
                Active: true,
                PrimaryFamilyContactPersonId: PersonId,
                Adults: [],
                Children: [],
                CustodialRelationships: [],
                UploadedDocuments: [],
                DeletedDocuments: [],
                CompletedCustomFields: [],
                History: [],
                IsTestFamily: false
            );
    }
}
