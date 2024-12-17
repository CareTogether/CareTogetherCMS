using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;

namespace CareTogether.Engines.PolicyEvaluation
{
    static class ApprovalCalculations
    {
        public static FamilyApprovalStatus CalculateCombinedFamilyApprovals(
            VolunteerPolicy volunteerPolicy,
            Family family,
            ImmutableList<Resources.CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<Resources.ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<
                Guid,
                ImmutableList<Resources.CompletedRequirementInfo>
            > completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<Resources.ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals
        )
        {
            ImmutableDictionary<Guid, IndividualApprovalStatus> allAdultsIndividualApprovalStatus = family
                .Adults.Select(adultFamilyEntry =>
                {
                    (Person person, FamilyAdultRelationshipInfo familyRelationship) = adultFamilyEntry;

                    ImmutableList<Resources.CompletedRequirementInfo> completedRequirements =
                        completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    ImmutableList<Resources.ExemptedRequirementInfo> exemptedRequirements =
                        exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                    ImmutableList<RoleRemoval> roleRemovals = individualRoleRemovals.GetValueOrEmptyList(person.Id);

                    IndividualApprovalStatus individualApprovalStatus =
                        IndividualApprovalCalculations.CalculateIndividualApprovalStatus(
                            volunteerPolicy.VolunteerRoles,
                            completedRequirements,
                            exemptedRequirements,
                            roleRemovals
                        );

                    return (person.Id, individualApprovalStatus);
                })
                .ToImmutableDictionary(x => x.Id, x => x.Item2);

            ImmutableDictionary<string, FamilyRoleApprovalStatus> familyRoleApprovalStatuses =
                FamilyApprovalCalculations.CalculateAllFamilyRoleApprovalStatuses(
                    volunteerPolicy.VolunteerFamilyRoles,
                    family,
                    completedFamilyRequirements,
                    exemptedFamilyRequirements,
                    familyRoleRemovals,
                    completedIndividualRequirements,
                    exemptedIndividualRequirements,
                    individualRoleRemovals
                );

            return new FamilyApprovalStatus(allAdultsIndividualApprovalStatus, familyRoleApprovalStatuses);
        }
    }
}
