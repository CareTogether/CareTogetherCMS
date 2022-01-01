using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Engines
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        private readonly IPoliciesResource policiesResource;


        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        public async Task<VolunteerFamilyApprovalStatus> CalculateVolunteerFamilyApprovalStatusAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RemovedRole> removedFamilyRoles,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RemovedRole>> removedIndividualRoles)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var missingFamilyRequirements = new HashSet<string>();
            var allMissingIndividualRequirements = new Dictionary<Guid, HashSet<string>>();
            // We do not currently support family role application requirements with a scope of per-adult, so this only needs to track per-family.
            var availableFamilyApplications = new HashSet<string>();

            var individualVolunteerRoles = family.Adults.Select(adultFamilyEntry =>
            {
                var (person, familyRelationship) = adultFamilyEntry;
                var individualRoles = new Dictionary<string, ImmutableList<RoleVersionApproval>>();
                var missingRequirements = new HashSet<string>();
                var availableApplications = new HashSet<string>();

                var completedRequirements = completedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var exemptedRequirements = exemptedIndividualRequirements.GetValueOrEmptyList(person.Id);
                var removedRoles = removedIndividualRoles.GetValueOrEmptyList(person.Id);

                foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerRoles
                    .Where(role => !removedRoles.Any(x => x.RoleName == role.Key)))
                {
                    var policyVersionApprovalStatus = rolePolicy.PolicyVersions
                        .Select(policyVersion => (PolicyVersion: policyVersion, Result:
                            ApprovalCalculations.CalculateIndividualVolunteerRoleApprovalStatus(
                                policyVersion, DateTime.UtcNow, completedRequirements, exemptedRequirements)));

                    //TODO: Bugfix for where non-applicable policy versions are still showing incomplete requirements
                    // var statusBasedOnFurthestApprovalReachedAmongVersions = policyVersionApprovalStatus
                    //     .OrderByDescending(x => x.Status)
                    //     .First();

                    var roleApprovals = policyVersionApprovalStatus
                        .Where(x => x.Result.Status != null)
                        .Select(x => new RoleVersionApproval(x.PolicyVersion.Version, x.Result.Status!.Value))
                        .ToImmutableList();
                    if (roleApprovals.Count > 0)
                        individualRoles[roleName] = roleApprovals;

                    missingRequirements.UnionWith(policyVersionApprovalStatus.SelectMany(x => x.Result.MissingRequirements));
                    availableApplications.UnionWith(policyVersionApprovalStatus.SelectMany(x => x.Result.AvailableApplications));
                }

                allMissingIndividualRequirements[person.Id] = missingRequirements;
                return (person.Id, new VolunteerApprovalStatus(individualRoles.ToImmutableDictionary(),
                    removedRoles, ImmutableList<string>.Empty, availableApplications.ToImmutableList()));
            }).ToImmutableDictionary(x => x.Item1, x => x.Item2);

            var familyRoles = new Dictionary<string, ImmutableList<RoleVersionApproval>>();
            foreach (var (roleName, rolePolicy) in policy.VolunteerPolicy.VolunteerFamilyRoles
                .Where(role => !removedFamilyRoles.Any(x => x.RoleName == role.Key)))
            {
                var policyVersionApprovalStatus = rolePolicy.PolicyVersions
                    .Select(policyVersion => (PolicyVersion: policyVersion, Result:
                        ApprovalCalculations.CalculateFamilyVolunteerRoleApprovalStatus(
                            roleName, policyVersion, DateTime.UtcNow, family,
                            completedFamilyRequirements, exemptedFamilyRequirements,
                            completedIndividualRequirements, exemptedIndividualRequirements,
                            removedIndividualRoles)));

                //TODO: Bugfix for where non-applicable policy versions are still showing incomplete requirements
                // var statusBasedOnFurthestApprovalReachedAmongVersions = policyVersionApprovalStatus
                //     .OrderByDescending(x => x.Status)
                //     .First();

                var roleApprovals = policyVersionApprovalStatus
                    .Where(x => x.Result.Status != null)
                    .Select(x => new RoleVersionApproval(x.PolicyVersion.Version, x.Result.Status!.Value))
                    .ToImmutableList();
                if (roleApprovals.Count > 0)
                    familyRoles[roleName] = roleApprovals;

                missingFamilyRequirements.UnionWith(policyVersionApprovalStatus.SelectMany(x => x.Result.MissingRequirements));
                availableFamilyApplications.UnionWith(policyVersionApprovalStatus.SelectMany(x => x.Result.AvailableApplications));
            }

            return new VolunteerFamilyApprovalStatus(
                familyRoles.ToImmutableDictionary(),
                removedFamilyRoles,
                missingFamilyRequirements.ToImmutableList(),
                availableFamilyApplications.ToImmutableList(),
                individualVolunteerRoles.ToImmutableDictionary(
                    x => x.Key,
                    x => x.Value with { MissingIndividualRequirements = allMissingIndividualRequirements[x.Key].ToImmutableList() }));
        }


        public async Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            var missingIntakeRequirements = policy.ReferralPolicy.RequiredIntakeActionNames.Where(requiredAction =>
                !referralEntry.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

            var individualArrangements = referralEntry.Arrangements.ToImmutableDictionary(
                arrangement => arrangement.Key,
                arrangement =>
                {
                    ArrangementPolicy arrangementPolicy = policy.ReferralPolicy.ArrangementPolicies
                        .Single(p => p.ArrangementType == arrangement.Value.ArrangementType);

                    return ReferralCalculations.CalculateArrangementStatus(arrangement.Value, arrangementPolicy);
                });

            return new ReferralStatus(
                missingIntakeRequirements,
                individualArrangements);
        }
    }
}
