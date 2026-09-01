using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class CalculateFamilyRoleVersionApprovalStatusTest
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
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

        [TestMethod]
        public void OldJsonRequirementWithoutIsRequiredDeserializesAsRequired()
        {
            var requirement = JsonConvert.DeserializeObject<VolunteerFamilyApprovalRequirement>(
                @"{""stage"":0,""actionName"":""Application"",""scope"":0}"
            );

            Assert.IsNotNull(requirement);
            Assert.AreEqual(RequirementStage.Application, requirement!.Stage);
            Assert.AreEqual("Application", requirement.ActionName);
            Assert.AreEqual(VolunteerFamilyRequirementScope.OncePerFamily, requirement.Scope);
            Assert.IsNull(requirement.IsRequired);
        }

        [TestMethod]
        public void NullIsRequiredApplicationRequirementStillBlocksProspective()
        {
            var result = CalculateFamilyStatus(
                H.FamilyApprovalRequirementsWithRequired(
                    (
                        RequirementStage.Application,
                        "Application",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        null
                    )
                ),
                completedFamilyRequirements: [],
                completedIndividualRequirements:
                    ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty
            );

            Assert.IsNull(result.Status);
            Assert.AreEqual(1, result.CurrentAvailableApplications.Count);
            Assert.AreEqual("Application", result.CurrentAvailableApplications.Single().ActionName);
        }

        [TestMethod]
        public void OptionalApprovalRequirementDoesNotBlockProgression()
        {
            var result = CalculateFamilyStatus(
                H.FamilyApprovalRequirementsWithRequired(
                    (
                        RequirementStage.Application,
                        "Application",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        true
                    ),
                    (
                        RequirementStage.Approval,
                        "OptionalApproval",
                        VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                        false
                    ),
                    (
                        RequirementStage.Onboarding,
                        "Onboarding",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        true
                    )
                ),
                completedFamilyRequirements: H.Completed(("Application", 1), ("Onboarding", 2)),
                completedIndividualRequirements:
                    ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(1, 1, RoleApprovalStatus.Approved),
                        H.DR(2, null, RoleApprovalStatus.Onboarded),
                    ]
                ),
                result.Status
            );
            Assert.AreEqual(0, result.CurrentMissingRequirements.Count);
            Assert.AreEqual(
                VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                result.Requirements.Single(r => r.ActionName == "OptionalApproval").Scope
            );
        }

        [TestMethod]
        public void OptionalOnboardingRequirementDoesNotBlockProgression()
        {
            var result = CalculateFamilyStatus(
                H.FamilyApprovalRequirementsWithRequired(
                    (
                        RequirementStage.Application,
                        "Application",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        true
                    ),
                    (
                        RequirementStage.Approval,
                        "Approval",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        true
                    ),
                    (
                        RequirementStage.Onboarding,
                        "OptionalOnboarding",
                        VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                        false
                    )
                ),
                completedFamilyRequirements: H.Completed(("Application", 1), ("Approval", 2)),
                completedIndividualRequirements:
                    ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [
                        H.DR(1, 1, RoleApprovalStatus.Prospective),
                        H.DR(2, null, RoleApprovalStatus.Onboarded),
                    ]
                ),
                result.Status
            );
            Assert.AreEqual(0, result.CurrentMissingRequirements.Count);
        }

        [TestMethod]
        public void RequiredAllAdultsScopeStillRequiresEveryActiveAdult()
        {
            var result = CalculateFamilyStatus(
                H.FamilyApprovalRequirementsWithRequired(
                    (
                        RequirementStage.Application,
                        "Application",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        true
                    ),
                    (
                        RequirementStage.Approval,
                        "Approval",
                        VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                        true
                    )
                ),
                completedFamilyRequirements: H.Completed(("Application", 1)),
                completedIndividualRequirements: H.CompletedIndividualRequirements(
                    (H.guid1, "Approval", 2)
                )
            );

            Assert.AreEqual(
                new DateOnlyTimeline<RoleApprovalStatus>(
                    [H.DR(1, null, RoleApprovalStatus.Prospective)]
                ),
                result.Status
            );

            var approvalRequirement = result.Requirements.Single(r => r.ActionName == "Approval");
            Assert.AreEqual(VolunteerFamilyRequirementScope.AllAdultsInTheFamily, approvalRequirement.Scope);
            Assert.IsNull(approvalRequirement.WhenMet);
            Assert.AreEqual(2, approvalRequirement.StatusDetails.Count);
            Assert.IsNotNull(
                approvalRequirement.StatusDetails.Single(detail => detail.PersonId == H.guid1).WhenMet
            );
            Assert.IsNull(
                approvalRequirement.StatusDetails.Single(detail => detail.PersonId == H.guid2).WhenMet
            );
        }

        [TestMethod]
        public void CompletedOptionalRequirementStillHasCompletionStatus()
        {
            var result = CalculateFamilyStatus(
                H.FamilyApprovalRequirementsWithRequired(
                    (
                        RequirementStage.Application,
                        "OptionalApplication",
                        VolunteerFamilyRequirementScope.OncePerFamily,
                        false
                    )
                ),
                completedFamilyRequirements: H.Completed(("OptionalApplication", 3)),
                completedIndividualRequirements:
                    ImmutableDictionary<Guid, ImmutableList<Resources.CompletedRequirementInfo>>.Empty
            );

            var requirement = result.Requirements.Single();
            Assert.AreEqual("OptionalApplication", requirement.ActionName);
            Assert.AreEqual(false, requirement.IsRequired);
            Assert.AreEqual(VolunteerFamilyRequirementScope.OncePerFamily, requirement.Scope);
            Assert.AreEqual(new DateOnlyTimeline([H.DR(3, null)]), requirement.WhenMet);
            Assert.IsNull(result.Status);
        }

        private static FamilyRoleVersionApprovalStatus CalculateFamilyStatus(
            ImmutableList<VolunteerFamilyApprovalRequirement> requirements,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.CompletedRequirementInfo>
            > completedIndividualRequirements
        ) =>
            FamilyApprovalCalculations.CalculateFamilyRoleVersionApprovalStatus(
                roleName: "Host Family",
                locationPolicy: TestLocationPolicy,
                new VolunteerFamilyRolePolicy("Host Family", []),
                new VolunteerFamilyRolePolicyVersion(
                    "v1",
                    SupersededAtUtc: null,
                    requirements
                ),
                CreateTestFamily(),
                completedFamilyRequirements,
                exemptedFamilyRequirements: [],
                removalsOfThisRole: [],
                completedIndividualRequirements,
                exemptedIndividualRequirements:
                    ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>>.Empty,
                individualRoleRemovals:
                    ImmutableDictionary<Guid, ImmutableList<RoleRemoval>>.Empty
            );

        private static Family CreateTestFamily()
        {
            var adult1 = CreatePerson(H.guid1, "John");
            var adult2 = CreatePerson(H.guid2, "Jane");

            return new Family(
                H.guid0,
                Active: true,
                H.guid1,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>
                    .Empty.Add((adult1, new FamilyAdultRelationshipInfo("Adult", true)))
                    .Add((adult2, new FamilyAdultRelationshipInfo("Adult", true))),
                ImmutableList<Person>.Empty,
                ImmutableList<CustodialRelationship>.Empty,
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CompletedCustomFieldInfo>.Empty,
                ImmutableList<Activity>.Empty,
                IsTestFamily: false
            );
        }

        private static Person CreatePerson(Guid id, string firstName) =>
            new Person(
                id,
                Active: true,
                firstName,
                "Volunteer",
                Gender.SeeNotes,
                Age: null,
                Ethnicity: null,
                ImmutableList<Address>.Empty,
                CurrentAddressId: null,
                ImmutableList<PhoneNumber>.Empty,
                PreferredPhoneNumberId: null,
                ImmutableList<EmailAddress>.Empty,
                PreferredEmailAddressId: null,
                Concerns: null,
                Notes: null
            );
    }
}
