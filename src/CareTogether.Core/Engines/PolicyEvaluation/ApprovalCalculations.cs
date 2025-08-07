using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class ApprovalCalculations
    {
        public static FamilyApprovalStatus CalculateCombinedFamilyApprovals(
            EffectiveLocationPolicy locationPolicy,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.CompletedRequirementInfo>
            > completedIndividualRequirements,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.ExemptedRequirementInfo>
            > exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        )
        {
            var volunteerPolicy = locationPolicy.VolunteerPolicy;
            
            var allAdultsIndividualApprovalStatus = family
                .Adults.Select(adultFamilyEntry =>
                {
                    var (person, familyRelationship) = adultFamilyEntry;

                    var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(
                        person.Id
                    );
                    var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(
                        person.Id
                    );
                    var roleRemovals = individualRoleRemovals.GetValueOrEmptyList(person.Id);

                    var individualApprovalStatus =
                        IndividualApprovalCalculations.CalculateIndividualApprovalStatus(
                            locationPolicy,
                            volunteerPolicy.VolunteerRoles,
                            completedRequirements,
                            exemptedRequirements,
                            roleRemovals
                        );

                    return (person.Id, individualApprovalStatus);
                })
                .ToImmutableDictionary(x => x.Id, x => x.Item2);

            var familyRoleApprovalStatuses =
                FamilyApprovalCalculations.CalculateAllFamilyRoleApprovalStatuses(
                    locationPolicy,
                    volunteerPolicy.VolunteerFamilyRoles,
                    family,
                    completedFamilyRequirements,
                    exemptedFamilyRequirements,
                    familyRoleRemovals,
                    completedIndividualRequirements,
                    exemptedIndividualRequirements,
                    individualRoleRemovals
                );

            return new FamilyApprovalStatus(
                allAdultsIndividualApprovalStatus,
                familyRoleApprovalStatuses
            );
        }
    }
}
