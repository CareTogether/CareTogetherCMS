using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources;
using CareTogether.Resources.OrganizationApprovals;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class OrganizationApprovalCalculationTests
    {
        private static readonly Guid OrganizationId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111"
        );

        [TestMethod]
        public void CompletingEachStageAdvancesTheOrganizationRole()
        {
            var policy = Policy();
            var entry = EmptyEntry() with
            {
                CompletedRequirements = Completed("Application"),
            };

            var prospective = OrganizationApprovalCalculations.Calculate(policy, entry);
            Assert.AreEqual(
                RoleApprovalStatus.Prospective,
                prospective.ApprovalStatusByRole["Partner"].CurrentStatus
            );

            var approved = OrganizationApprovalCalculations.Calculate(
                policy,
                entry with
                {
                    CompletedRequirements = Completed("Application", "Approval"),
                }
            );
            Assert.AreEqual(
                RoleApprovalStatus.Approved,
                approved.ApprovalStatusByRole["Partner"].CurrentStatus
            );

            var onboarded = OrganizationApprovalCalculations.Calculate(
                policy,
                entry with
                {
                    CompletedRequirements = Completed(
                        "Application",
                        "Approval",
                        "Onboarding"
                    ),
                }
            );
            Assert.AreEqual(
                RoleApprovalStatus.Onboarded,
                onboarded.ApprovalStatusByRole["Partner"].CurrentStatus
            );
        }

        [TestMethod]
        public void ApplicationActionIsAvailableBeforeTheOrganizationApplies()
        {
            var result = OrganizationApprovalCalculations.Calculate(Policy(), EmptyEntry());
            var role = result.ApprovalStatusByRole["Partner"];

            Assert.IsNull(role.CurrentStatus);
            CollectionAssert.AreEqual(
                new[] { "Application" },
                role.CurrentAvailableApplications.ConvertAll(requirement => requirement.ActionName)
                    .ToArray()
            );
        }

        private static OrganizationApprovalEntry EmptyEntry() =>
            new(
                OrganizationId,
                ImmutableList<Resources.CompletedRequirementInfo>.Empty,
                ImmutableList<Resources.ExemptedRequirementInfo>.Empty,
                ImmutableList<Resources.Approvals.RoleRemoval>.Empty
            );

        private static ImmutableList<Resources.CompletedRequirementInfo> Completed(
            params string[] names
        ) =>
            names
                .ToImmutableList()
                .ConvertAll(name =>
                    new Resources.CompletedRequirementInfo(
                        Guid.Empty,
                        DateTime.UtcNow.AddDays(-1),
                        Guid.NewGuid(),
                        name,
                        DateTime.UtcNow.AddDays(-1),
                        null,
                        null,
                        null
                    )
                );

        private static EffectiveLocationPolicy Policy() =>
            new(
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
            )
            {
                OrganizationApprovalPolicy = new OrganizationApprovalPolicy(
                    ImmutableDictionary<string, OrganizationRolePolicy>.Empty.Add(
                        "Partner",
                        new OrganizationRolePolicy(
                            "Partner",
                            ImmutableList.Create(
                                new OrganizationRolePolicyVersion(
                                    "v1",
                                    null,
                                    ImmutableList.Create(
                                        new OrganizationApprovalRequirement(
                                            RequirementStage.Application,
                                            "Application"
                                        ),
                                        new OrganizationApprovalRequirement(
                                            RequirementStage.Approval,
                                            "Approval"
                                        ),
                                        new OrganizationApprovalRequirement(
                                            RequirementStage.Onboarding,
                                            "Onboarding"
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),
            };
    }
}
