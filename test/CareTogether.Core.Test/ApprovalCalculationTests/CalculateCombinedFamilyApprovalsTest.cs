using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.IdentityModel.Tokens;
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
                                                "ApplicationReq1",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Application,
                                                "ApplicationReq2",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "ApprovalReq1",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "ApprovalReq2",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "OnboardingReq1",
                                                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "OnboardingReq2",
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
                                                "ApplicationReq1",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Application,
                                                "ApplicationReq2",
                                                VolunteerFamilyRequirementScope.OncePerFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "ApprovalReqA",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Approval,
                                                "ApprovalReqB",
                                                VolunteerFamilyRequirementScope.AllAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "OnboardingReqA",
                                                VolunteerFamilyRequirementScope.AllParticipatingAdultsInTheFamily
                                            ),
                                            (
                                                RequirementStage.Onboarding,
                                                "OnboardingReqB",
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

        [DataTestMethod]
        [DataRow(
            "ApplicationReq1,ApplicationReq2",
            "",
            "",
            "ApprovalReq1,ApprovalReq2,ApprovalReqA,ApprovalReqB"
        )]
        [DataRow(
            "ApplicationReq1,ApplicationReq2",
            "ApprovalReq1",
            "",
            "ApprovalReq2,ApprovalReqA,ApprovalReqB"
        )]
        [DataRow(
            "ApplicationReq1,ApplicationReq2",
            "ApprovalReq1,ApprovalReq2",
            "",
            "OnboardingReq1,OnboardingReq2"
        )]
        [DataRow(
            "ApplicationReq1,ApplicationReq2",
            "ApprovalReq1,ApprovalReq2,OnboardingReq1",
            "",
            "OnboardingReq2"
        )]
        [DataRow(
            "ApplicationReq1,ApplicationReq2",
            "ApprovalReq1,ApprovalReq2,OnboardingReq1,OnboardingReq2",
            "",
            ""
        )]
        public void ShouldCalculateCorrectlyWhenFamilyRole1RequirementIsCompleted(
            string familyRequirementNamesString,
            string individualRequirementNamesString,
            string expectedFamilyLevelMissingRequirementsString,
            string expectedIndividualLevelMissingRequirementsString
        )
        {
            var family = CreateTestFamily();

            var familyRequirementNames = familyRequirementNamesString.Split(',');
            var completedFamilyRequirements = H.Completed(
                familyRequirementNames.Select(name => (name, 1)).ToArray()
            );

            var individualRequirementNames = individualRequirementNamesString.Split(',');
            var completedIndividualRequirements = individualRequirementNames.Any(name =>
                !string.IsNullOrEmpty(name)
            )
                ? H.CompletedIndividualRequirements(
                    individualRequirementNames
                        .Where(name => !string.IsNullOrEmpty(name))
                        .SelectMany(name => new[] { (H.guid1, name, 1), (H.guid2, name, 1) })
                        .ToArray()
                )
                : ImmutableDictionary<
                    Guid,
                    ImmutableList<Resources.CompletedRequirementInfo>
                >.Empty;

            var result = ApprovalCalculations.CalculateCombinedFamilyApprovals(
                locationPolicy: TestLocationPolicy,
                family: family,
                completedFamilyRequirements: completedFamilyRequirements,
                exemptedFamilyRequirements: ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                familyRoleRemovals: ImmutableList<RoleRemoval>.Empty,
                completedIndividualRequirements: completedIndividualRequirements,
                exemptedIndividualRequirements: ImmutableDictionary<
                    Guid,
                    ImmutableList<Resources.ExemptedRequirementInfo>
                >.Empty,
                individualRoleRemovals: ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

            // Basic verification that the calculation completed successfully
            Assert.IsNotNull(result, "Result should not be null");
            Assert.IsNotNull(result.FamilyRoleApprovals, "FamilyRoleApprovals should not be null");
            Assert.IsNotNull(result.IndividualApprovals, "IndividualApprovals should not be null");

            // Verify that both adults have individual approvals calculated
            Assert.AreEqual(
                2,
                result.IndividualApprovals.Count,
                "Should have individual approvals for both adults"
            );
            Assert.IsTrue(
                result.IndividualApprovals.ContainsKey(H.guid1),
                "Should contain approval for first adult"
            );
            Assert.IsTrue(
                result.IndividualApprovals.ContainsKey(H.guid2),
                "Should contain approval for second adult"
            );

            var expectedFamilyLevelMissingRequirements =
                !expectedFamilyLevelMissingRequirementsString.IsNullOrEmpty()
                    ? expectedFamilyLevelMissingRequirementsString?.Split(',')
                    : null;
            if (expectedFamilyLevelMissingRequirements?.Count() > 0)
            {
                var actualFamilyMissingRequirements = result
                    .CurrentMissingFamilyRequirements.Select(req => req.ActionName)
                    .Distinct()
                    .ToImmutableList();

                Assert.IsTrue(
                    actualFamilyMissingRequirements.SequenceEqual(
                        expectedFamilyLevelMissingRequirements
                    )
                );
            }

            var expectedIndividualLevelMissingRequirements =
                !expectedIndividualLevelMissingRequirementsString.IsNullOrEmpty()
                    ? expectedIndividualLevelMissingRequirementsString?.Split(',')
                    : null;
            if (expectedIndividualLevelMissingRequirements?.Count() > 0)
            {
                var actualIndividualMissingRequirements = result
                    .CurrentMissingIndividualRequirements.Select(req => req.ActionName)
                    .Distinct()
                    .ToImmutableList();

                Assert.IsTrue(
                    actualIndividualMissingRequirements.SequenceEqual(
                        expectedIndividualLevelMissingRequirements
                    )
                );
            }
        }
    }
}
