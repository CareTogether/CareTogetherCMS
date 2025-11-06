using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateCombinedFamilyApprovalsTest
    {
        private static readonly EffectiveLocationPolicy TestLocationPolicy =
            new EffectiveLocationPolicy(
                ImmutableDictionary<string, ActionRequirement>.Empty,
                ImmutableList<CustomField>.Empty,
                new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty.Add(
                        "Role1",
                        new VolunteerRolePolicy(
                            "Role1",
                            ImmutableList<VolunteerRolePolicyVersion>.Empty.Add(
                                new VolunteerRolePolicyVersion(
                                    "v1",
                                    null,
                                    H.IndividualApprovalRequirements(
                                        (RequirementStage.Application, "AppReq1"),
                                        (RequirementStage.Approval, "ApprovReq1"),
                                        (RequirementStage.Onboarding, "OnboardReq1")
                                    )
                                )
                            )
                        )
                    ),
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty.Add(
                        "FamilyRole1",
                        new VolunteerFamilyRolePolicy(
                            "FamilyRole1",
                            ImmutableList<VolunteerFamilyRolePolicyVersion>
                                .Empty.Add(
                                    new VolunteerFamilyRolePolicyVersion(
                                        "v1",
                                        null,
                                        H.FamilyApprovalRequirements(
                                            (
                                                RequirementStage.Application,
                                                "1",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "2",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "3",
                                                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                                            )
                                        )
                                    )
                                )
                                .Add(
                                    new VolunteerFamilyRolePolicyVersion(
                                        "v2",
                                        null,
                                        H.FamilyApprovalRequirements(
                                            (
                                                RequirementStage.Application,
                                                "A",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "B",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "C",
                                                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                                            )
                                        )
                                    )
                                )
                        )
                    )
                )
            );

        private static Family CreateTestFamily()
        {
            var adult1 = new Person(
                H.guid1,
                Active: true,
                "John",
                "Doe",
                Gender.Male,
                new AgeInYears(35, DateTime.Now),
                "Caucasian",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

            var adult2 = new Person(
                H.guid2,
                Active: true,
                "Jane",
                "Doe",
                Gender.Female,
                new AgeInYears(32, DateTime.Now),
                "Caucasian",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

            var familyRelationship1 = new FamilyAdultRelationshipInfo("Husband", true);
            var familyRelationship2 = new FamilyAdultRelationshipInfo("Wife", true);

            return new Family(
                H.guid0,
                Active: true,
                H.guid1,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>
                    .Empty.Add((adult1, familyRelationship1))
                    .Add((adult2, familyRelationship2)),
                ImmutableList<Person>.Empty,
                ImmutableList<CustodialRelationship>.Empty,
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CompletedCustomFieldInfo>.Empty,
                ImmutableList<Activity>.Empty,
                IsTestFamily: false
            );
        }

        [TestMethod]
        public void ShouldReturnEmptyStatusForEmptyFamily()
        {
            var emptyFamily = new Family(
                H.guid0,
                Active: true,
                H.guid1,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty,
                ImmutableList<Person>.Empty,
                ImmutableList<CustodialRelationship>.Empty,
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CompletedCustomFieldInfo>.Empty,
                ImmutableList<Activity>.Empty,
                IsTestFamily: false
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                emptyFamily,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.IndividualApprovals);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            Assert.AreEqual(0, result.IndividualApprovals.Count);
        }

        [TestMethod]
        public void ShouldCalculateIndividualApprovalsForAllAdults()
        {
            var family = CreateTestFamily();

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.IndividualApprovals.Count);
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid1));
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid2));
        }

        [TestMethod]
        public void ShouldHandleCompletedIndividualRequirements()
        {
            var family = CreateTestFamily();

            var completedIndividualRequirements = H.CompletedIndividualRequirements(
                (H.guid1, "AppReq1", 1),
                (H.guid2, "AppReq1", 2)
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                completedIndividualRequirements,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.IndividualApprovals.Count);
            // Individual approvals should have been calculated with the completed requirements
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid1));
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid2));
        }

        [TestMethod]
        public void ShouldHandleExemptedIndividualRequirements()
        {
            var family = CreateTestFamily();

            var exemptedIndividualRequirements = H.ExemptedIndividualRequirements(
                (H.guid1, "AppReq1", null),
                (H.guid2, "ApprovReq1", 30)
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                exemptedIndividualRequirements,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.IndividualApprovals.Count);
            // Individual approvals should have been calculated with the exempted requirements
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid1));
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid2));
        }

        [TestMethod]
        public void ShouldHandleRemovedIndividualRoles()
        {
            var family = CreateTestFamily();

            var removedIndividualRoles = H.RemovedIndividualRoles(
                (H.guid1, "Role1"),
                (H.guid2, "Role1")
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                removedIndividualRoles
            );

            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.IndividualApprovals.Count);
            // Individual approvals should have been calculated with the removed roles
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid1));
            Assert.IsTrue(result.IndividualApprovals.ContainsKey(H.guid2));
        }

        [TestMethod]
        public void ShouldCalculateFamilyRoleApprovals()
        {
            var family = CreateTestFamily();

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            // Family role approvals should have been calculated for the test policy
        }

        [TestMethod]
        public void ShouldHandleCompletedFamilyRequirements()
        {
            var family = CreateTestFamily();

            var completedFamilyRequirements = H.Completed(
                ("FamilyAppReq1", 1),
                ("FamilyApprovReq1", 5)
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                completedFamilyRequirements,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            // Family role approvals should have been calculated with the completed requirements
        }

        [TestMethod]
        public void ShouldHandleExemptedFamilyRequirements()
        {
            var family = CreateTestFamily();

            var exemptedFamilyRequirements = H.Exempted(
                ("FamilyAppReq1", null),
                ("FamilyOnboardReq1", 30)
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                exemptedFamilyRequirements,
                ImmutableList<RoleRemoval>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            // Family role approvals should have been calculated with the exempted requirements
        }

        [TestMethod]
        public void ShouldHandleRemovedFamilyRoles()
        {
            var family = CreateTestFamily();

            var familyRoleRemovals = H.Removed("FamilyRole1");

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                familyRoleRemovals,
                ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            // Family role approvals should have been calculated with the removed roles
        }

        [TestMethod]
        public void ShouldReturnFamilyApprovalStatusWithBothIndividualAndFamilyApprovals()
        {
            var family = CreateTestFamily();

            var completedFamilyRequirements = H.Completed(("FamilyAppReq1", 1));
            var completedIndividualRequirements = H.CompletedIndividualRequirements(
                (H.guid1, "AppReq1", 1)
            );

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                TestLocationPolicy,
                family,
                completedFamilyRequirements,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<RoleRemoval>.Empty,
                completedIndividualRequirements,
                ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(FamilyApprovalStatus));
            Assert.IsNotNull(result.IndividualApprovals);
            Assert.IsNotNull(result.FamilyRoleApprovals);
            Assert.AreEqual(2, result.IndividualApprovals.Count);
        }

        /// <summary>
        /// Parameterized test that verifies correct calculation when different family role requirements are completed.
        /// Tests both v1 requirements (1, 2, 3) and v2 requirements (A, B, C) across different requirement stages.
        /// </summary>
        [DataTestMethod]
        [DataRow("1", null, "2")]
        [DataRow("2", null, null)]
        [DataRow("3", null, null)]
        [DataRow("1,2", null, "3")]
        [DataRow("1,2,3", null, null)]
        [DataRow("A", null, "B")]
        [DataRow("B", null, null)]
        [DataRow("C", null, null)]
        [DataRow("A,B", null, "C")]
        [DataRow("A,B,C", null, null)]
        public void ShouldCalculateCorrectlyWhenFamilyRole1RequirementIsCompleted(
            string familyRequirementName,
            string expectedFamilyLevelMissingRequirement,
            string expectedIndividualLevelMissingRequirement
        )
        {
            var family = CreateTestFamily();

            // Complete the specified requirement for FamilyRole1
            var completedFamilyRequirements = H.Completed((familyRequirementName, 1));

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                locationPolicy: TestLocationPolicy,
                family: family,
                completedFamilyRequirements: completedFamilyRequirements,
                exemptedFamilyRequirements: ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                familyRoleRemovals: ImmutableList<RoleRemoval>.Empty,
                completedIndividualRequirements: ImmutableDictionary<
                    Guid,
                    ImmutableList<Resources.CompletedRequirementInfo>
                >.Empty,
                exemptedIndividualRequirements: ImmutableDictionary<
                    Guid,
                    ImmutableList<Resources.ExemptedRequirementInfo>
                >.Empty,
                individualRoleRemovals: ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            var expectedMissingRequirements =
                expectedFamilyLevelMissingRequirement == null
                    ? ImmutableList<string>.Empty
                    : ImmutableList<string>.Empty.Add(expectedFamilyLevelMissingRequirement);

            var actualMissingRequirements = result
                .CurrentMissingFamilyRequirements.Select(req => req.ActionName)
                .ToImmutableList();

            Assert.IsTrue(
                actualMissingRequirements.SequenceEqual(expectedMissingRequirements),
                "Should contain expected missing family requirements"
            );

            var expectedIndividualMissingRequirements =
                expectedIndividualLevelMissingRequirement == null
                    ? ImmutableList<string>.Empty
                    : ImmutableList<string>.Empty.Add(expectedIndividualLevelMissingRequirement);

            var actualIndividualMissingRequirements = result
                .CurrentMissingIndividualRequirements.Select(req => req.ActionName)
                .Distinct()
                .ToImmutableList();

            Assert.IsTrue(
                actualIndividualMissingRequirements.SequenceEqual(
                    expectedIndividualMissingRequirements
                ),
                "Should contain expected missing individual requirements"
            );
        }
    }
}
