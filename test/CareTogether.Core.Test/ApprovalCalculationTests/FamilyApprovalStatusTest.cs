using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ApprovalCalculationTests.Helpers;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class FamilyApprovalStatusTest
    {
        [TestClass]
        public class RequirementHidingTests
        {
            private static IndividualRoleVersionApprovalStatus CreateIndividualRoleVersion(
                string roleName,
                string version,
                RoleApprovalStatus? status,
                params IndividualRoleRequirementCompletionStatus[] requirements
            )
            {
                var timeline = status.HasValue
                    ? new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, null, status.Value)])
                    : null;

                return new IndividualRoleVersionApprovalStatus(
                    roleName,
                    version,
                    timeline,
                    requirements.ToImmutableList()
                );
            }

            private static FamilyRoleVersionApprovalStatus CreateFamilyRoleVersion(
                string roleName,
                string version,
                RoleApprovalStatus? status,
                params FamilyRoleRequirementCompletionStatus[] requirements
            )
            {
                var timeline = status.HasValue
                    ? new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, null, status.Value)])
                    : null;

                return new FamilyRoleVersionApprovalStatus(
                    roleName,
                    version,
                    timeline,
                    requirements.ToImmutableList()
                );
            }

            private static IndividualRoleRequirementCompletionStatus CreateIndividualRequirement(
                string actionName,
                RequirementStage stage,
                bool isMet = false
            )
            {
                var whenMet = isMet ? new DateOnlyTimeline([H.DR(1, null, true)]) : null;

                return new IndividualRoleRequirementCompletionStatus(actionName, stage, whenMet);
            }

            private static FamilyRoleRequirementCompletionStatus CreateFamilyRequirement(
                string actionName,
                RequirementStage stage,
                VolunteerFamilyRequirementScope scope,
                bool isMet = false,
                params Guid[] personIds
            )
            {
                var whenMet = isMet ? new DateOnlyTimeline([H.DR(1, null, true)]) : null;

                var statusDetails =
                    personIds.Length > 0
                        ? personIds
                            .Select(pid => new FamilyRequirementStatusDetail(pid, whenMet))
                            .ToImmutableList()
                        : ImmutableList.Create(new FamilyRequirementStatusDetail(null, whenMet));

                return new FamilyRoleRequirementCompletionStatus(
                    actionName,
                    stage,
                    scope,
                    whenMet,
                    statusDetails
                );
            }

            [TestMethod]
            public void CurrentMissingIndividualRequirements_OnboardedRoleHidesAllStages()
            {
                // Arrange
                var personId = Guid.NewGuid();

                var individualRoleApprovals = ImmutableDictionary
                    .Create<string, IndividualRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new IndividualRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Onboarded)]
                            ),
                            ImmutableList.Create(
                                // Version 1: Onboarded (should hide all requirements from other versions)
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Onboarded
                                ),
                                // Version 2: Has missing requirements that should be hidden
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v2",
                                    RoleApprovalStatus.Prospective,
                                    CreateIndividualRequirement(
                                        "ApplicationAction",
                                        RequirementStage.Application
                                    ),
                                    CreateIndividualRequirement(
                                        "ApprovalAction",
                                        RequirementStage.Approval
                                    ),
                                    CreateIndividualRequirement(
                                        "OnboardingAction",
                                        RequirementStage.Onboarding
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary
                        .Create<Guid, IndividualApprovalStatus>()
                        .Add(personId, new IndividualApprovalStatus(individualRoleApprovals)),
                    ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty
                );

                // Act
                var result = familyApprovalStatus.CurrentMissingIndividualRequirements;

                // Assert
                Assert.AreEqual(
                    0,
                    result.Count,
                    "No individual requirements should be shown when role is Onboarded"
                );
            }

            [TestMethod]
            public void CurrentMissingIndividualRequirements_ApprovedRoleHidesApplicationAndApproval()
            {
                // Arrange
                var personId = Guid.NewGuid();

                var individualRoleApprovals = ImmutableDictionary
                    .Create<string, IndividualRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new IndividualRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Approved)]
                            ),
                            ImmutableList.Create(
                                // Version 1: Approved (should hide Application and Approval requirements from other versions)
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Approved
                                ),
                                // Version 2: Has missing requirements
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v2",
                                    RoleApprovalStatus.Prospective,
                                    CreateIndividualRequirement(
                                        "ApplicationAction",
                                        RequirementStage.Application
                                    ),
                                    CreateIndividualRequirement(
                                        "ApprovalAction",
                                        RequirementStage.Approval
                                    ),
                                    CreateIndividualRequirement(
                                        "OnboardingAction",
                                        RequirementStage.Onboarding
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary
                        .Create<Guid, IndividualApprovalStatus>()
                        .Add(personId, new IndividualApprovalStatus(individualRoleApprovals)),
                    ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty
                );

                // Act
                var result = familyApprovalStatus.CurrentMissingIndividualRequirements;

                // Assert
                Assert.AreEqual(
                    1,
                    result.Count,
                    "Only Onboarding requirements should be shown when role is Approved"
                );
                Assert.AreEqual("OnboardingAction", result[0].ActionName);
            }

            [TestMethod]
            public void CurrentMissingIndividualRequirements_ProspectiveRoleHidesApplication()
            {
                // Arrange
                var personId = Guid.NewGuid();

                var individualRoleApprovals = ImmutableDictionary
                    .Create<string, IndividualRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new IndividualRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Prospective)]
                            ),
                            ImmutableList.Create(
                                // Version 1: Prospective (should hide Application requirements from other versions)
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Prospective
                                ),
                                // Version 2: Has missing requirements
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v2",
                                    null,
                                    CreateIndividualRequirement(
                                        "ApplicationAction",
                                        RequirementStage.Application
                                    ),
                                    CreateIndividualRequirement(
                                        "ApprovalAction",
                                        RequirementStage.Approval
                                    ),
                                    CreateIndividualRequirement(
                                        "OnboardingAction",
                                        RequirementStage.Onboarding
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary
                        .Create<Guid, IndividualApprovalStatus>()
                        .Add(personId, new IndividualApprovalStatus(individualRoleApprovals)),
                    ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty
                );

                // Act
                var result = familyApprovalStatus.CurrentMissingIndividualRequirements;

                // Assert
                Assert.AreEqual(
                    2,
                    result.Count,
                    "Approval and Onboarding requirements should be shown when role is Prospective"
                );
                var actionNames = result.Select(r => r.ActionName).ToHashSet();
                Assert.IsTrue(actionNames.Contains("ApprovalAction"));
                Assert.IsTrue(actionNames.Contains("OnboardingAction"));
                Assert.IsFalse(actionNames.Contains("ApplicationAction"));
            }

            [TestMethod]
            public void CurrentAvailableIndividualApplications_ProspectiveRoleHidesApplications()
            {
                // Arrange
                var personId = Guid.NewGuid();

                var individualRoleApprovals = ImmutableDictionary
                    .Create<string, IndividualRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new IndividualRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Prospective)]
                            ),
                            ImmutableList.Create(
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Prospective
                                ),
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v2",
                                    null,
                                    CreateIndividualRequirement(
                                        "ApplicationAction",
                                        RequirementStage.Application
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary
                        .Create<Guid, IndividualApprovalStatus>()
                        .Add(personId, new IndividualApprovalStatus(individualRoleApprovals)),
                    ImmutableDictionary<string, FamilyRoleApprovalStatus>.Empty
                );

                // Act
                var result = familyApprovalStatus.CurrentAvailableIndividualApplications;

                // Assert
                Assert.AreEqual(
                    0,
                    result.Count,
                    "No applications should be available when role has achieved Prospective status"
                );
            }

            [TestMethod]
            public void CurrentMissingFamilyRequirements_HidesByFamilyRoleStatus()
            {
                // Arrange
                var familyRoleApprovals = ImmutableDictionary
                    .Create<string, FamilyRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new FamilyRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Approved)]
                            ),
                            ImmutableList.Create(
                                // Version 1: Approved (should hide Application and Approval requirements from other versions)
                                CreateFamilyRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Approved
                                ),
                                // Version 2: Has missing family requirements
                                CreateFamilyRoleVersion(
                                    "TestRole",
                                    "v2",
                                    RoleApprovalStatus.Prospective,
                                    CreateFamilyRequirement(
                                        "FamilyApplicationAction",
                                        RequirementStage.Application,
                                        VolunteerFamilyRequirementScope.OncePerFamily
                                    ),
                                    CreateFamilyRequirement(
                                        "FamilyApprovalAction",
                                        RequirementStage.Approval,
                                        VolunteerFamilyRequirementScope.OncePerFamily
                                    ),
                                    CreateFamilyRequirement(
                                        "FamilyOnboardingAction",
                                        RequirementStage.Onboarding,
                                        VolunteerFamilyRequirementScope.OncePerFamily
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary<Guid, IndividualApprovalStatus>.Empty,
                    familyRoleApprovals
                );

                // Act
                var result = familyApprovalStatus.CurrentMissingFamilyRequirements;

                // Assert
                Assert.AreEqual(
                    1,
                    result.Count,
                    "Only Onboarding requirements should be shown when family role is Approved"
                );
                Assert.AreEqual("FamilyOnboardingAction", result[0].ActionName);
            }

            [TestMethod]
            public void RoleHighestStatuses_CombinesFamilyAndIndividualStatuses()
            {
                // Arrange
                var personId = Guid.NewGuid();

                var individualRoleApprovals = ImmutableDictionary
                    .Create<string, IndividualRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new IndividualRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Approved)]
                            ),
                            ImmutableList.Create(
                                CreateIndividualRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Approved
                                )
                            )
                        )
                    );

                var familyRoleApprovals = ImmutableDictionary
                    .Create<string, FamilyRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new FamilyRoleApprovalStatus(
                            new DateOnlyTimeline<RoleApprovalStatus>(
                                [H.DR(1, null, RoleApprovalStatus.Prospective)]
                            ),
                            ImmutableList.Create(
                                CreateFamilyRoleVersion(
                                    "TestRole",
                                    "v2",
                                    RoleApprovalStatus.Prospective
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary
                        .Create<Guid, IndividualApprovalStatus>()
                        .Add(personId, new IndividualApprovalStatus(individualRoleApprovals)),
                    familyRoleApprovals
                );

                // Act - Using reflection to access private property for testing
                var roleHighestStatusesProperty = typeof(FamilyApprovalStatus).GetProperty(
                    "RoleHighestStatuses",
                    System.Reflection.BindingFlags.NonPublic
                        | System.Reflection.BindingFlags.Instance
                );
                var roleHighestStatuses =
                    (ImmutableDictionary<string, RoleApprovalStatus>)
                        roleHighestStatusesProperty!.GetValue(familyApprovalStatus)!;

                // Assert
                Assert.IsTrue(roleHighestStatuses.ContainsKey("TestRole"));
                Assert.AreEqual(
                    RoleApprovalStatus.Approved,
                    roleHighestStatuses["TestRole"],
                    "Should take the highest status between family (Prospective) and individual (Approved)"
                );
            }

            [TestMethod]
            public void CurrentMissingIndividualRequirements_GroupsByPersonAndAction()
            {
                // Arrange
                var personId1 = Guid.NewGuid();
                var personId2 = Guid.NewGuid();

                var familyRoleApprovals = ImmutableDictionary
                    .Create<string, FamilyRoleApprovalStatus>()
                    .Add(
                        "TestRole",
                        new FamilyRoleApprovalStatus(
                            null,
                            ImmutableList.Create(
                                CreateFamilyRoleVersion(
                                    "TestRole",
                                    "v1",
                                    RoleApprovalStatus.Prospective,
                                    CreateFamilyRequirement(
                                        "BackgroundCheck",
                                        RequirementStage.Approval,
                                        VolunteerFamilyRequirementScope.AllAdultsInTheFamily,
                                        false,
                                        personId1,
                                        personId2
                                    )
                                )
                            )
                        )
                    );

                var familyApprovalStatus = new FamilyApprovalStatus(
                    ImmutableDictionary<Guid, IndividualApprovalStatus>.Empty,
                    familyRoleApprovals
                );

                // Act
                var result = familyApprovalStatus.CurrentMissingIndividualRequirements;

                // Assert
                Assert.AreEqual(2, result.Count, "Should have one requirement per person");
                var personIds = result.Select(r => r.PersonId).ToHashSet();
                Assert.IsTrue(personIds.Contains(personId1));
                Assert.IsTrue(personIds.Contains(personId2));
                Assert.IsTrue(result.All(r => r.ActionName == "BackgroundCheck"));
            }
        }

        [TestClass]
        public class FamilyRoleApprovalStatusTests
        {
            private static FamilyRoleVersionApprovalStatus CreateFamilyRoleVersion(
                string roleName,
                string version,
                RoleApprovalStatus? status,
                params FamilyRoleRequirementCompletionStatus[] requirements
            )
            {
                var timeline = status.HasValue
                    ? new DateOnlyTimeline<RoleApprovalStatus>([H.DR(1, null, status.Value)])
                    : null;

                return new FamilyRoleVersionApprovalStatus(
                    roleName,
                    version,
                    timeline,
                    requirements.ToImmutableList()
                );
            }

            private static FamilyRoleRequirementCompletionStatus CreateFamilyRequirement(
                string actionName,
                RequirementStage stage,
                VolunteerFamilyRequirementScope scope,
                bool isMet = false
            )
            {
                var whenMet = isMet ? new DateOnlyTimeline([H.DR(1, null, true)]) : null;

                return new FamilyRoleRequirementCompletionStatus(
                    actionName,
                    stage,
                    scope,
                    whenMet,
                    ImmutableList<FamilyRequirementStatusDetail>.Empty
                );
            }

            [TestMethod]
            public void CurrentMissingFamilyRequirements_UsesMaxRoleStatusHelper()
            {
                // Arrange
                var familyRoleApprovalStatus = new FamilyRoleApprovalStatus(
                    null,
                    ImmutableList.Create(
                        // Version 1: Approved status should hide Application and Approval requirements from other versions
                        CreateFamilyRoleVersion("TestRole", "v1", RoleApprovalStatus.Approved),
                        // Version 2: Has missing requirements that should be filtered
                        CreateFamilyRoleVersion(
                            "TestRole",
                            "v2",
                            RoleApprovalStatus.Prospective,
                            CreateFamilyRequirement(
                                "ApplicationAction",
                                RequirementStage.Application,
                                VolunteerFamilyRequirementScope.OncePerFamily
                            ),
                            CreateFamilyRequirement(
                                "ApprovalAction",
                                RequirementStage.Approval,
                                VolunteerFamilyRequirementScope.OncePerFamily
                            ),
                            CreateFamilyRequirement(
                                "OnboardingAction",
                                RequirementStage.Onboarding,
                                VolunteerFamilyRequirementScope.OncePerFamily
                            )
                        )
                    )
                );

                // Act
                var result = familyRoleApprovalStatus.CurrentMissingFamilyRequirements;

                // Assert
                Assert.AreEqual(
                    1,
                    result.Count,
                    "Only Onboarding requirements should be shown when highest status is Approved"
                );
                Assert.AreEqual("OnboardingAction", result[0].ActionName);
            }

            [TestMethod]
            public void CurrentAvailableFamilyApplications_UsesMaxRoleStatusHelper()
            {
                // Arrange
                var familyRoleApprovalStatus = new FamilyRoleApprovalStatus(
                    null,
                    ImmutableList.Create(
                        // Version 1: Prospective status should hide applications
                        CreateFamilyRoleVersion("TestRole", "v1", RoleApprovalStatus.Prospective),
                        // Version 2: Has available applications that should be hidden
                        CreateFamilyRoleVersion(
                            "TestRole",
                            "v2",
                            null,
                            CreateFamilyRequirement(
                                "ApplicationAction",
                                RequirementStage.Application,
                                VolunteerFamilyRequirementScope.OncePerFamily
                            )
                        )
                    )
                );

                // Act
                var result = familyRoleApprovalStatus.CurrentAvailableFamilyApplications;

                // Assert
                Assert.AreEqual(
                    0,
                    result.Count,
                    "No applications should be available when highest status is Prospective or higher"
                );
            }
        }
    }
}
