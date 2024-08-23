using CareTogether.Resources;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed class PolicyEvaluationEngine : IPolicyEvaluationEngine
    {
        private readonly IPoliciesResource policiesResource;


        public PolicyEvaluationEngine(IPoliciesResource policiesResource)
        {
            this.policiesResource = policiesResource;
        }


        public async Task<FamilyApprovalStatus> CalculateCombinedFamilyApprovalsAsync(Guid organizationId, Guid locationId,
            Family family, ImmutableList<CompletedRequirementInfo> completedFamilyRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedFamilyRequirements,
            ImmutableList<RoleRemoval> familyRoleRemovals,
            ImmutableDictionary<Guid, ImmutableList<CompletedRequirementInfo>> completedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<ExemptedRequirementInfo>> exemptedIndividualRequirements,
            ImmutableDictionary<Guid, ImmutableList<RoleRemoval>> individualRoleRemovals)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);

            return ApprovalCalculations.CalculateCombinedFamilyApprovals(
                policy.VolunteerPolicy, family,
                completedFamilyRequirements, exemptedFamilyRequirements, familyRoleRemovals,
                completedIndividualRequirements, exemptedIndividualRequirements, individualRoleRemovals);
        }


        public async Task<ReferralStatus> CalculateReferralStatusAsync(
            Guid organizationId, Guid locationId, Family family,
            ReferralEntry referralEntry)
        {
            var policy = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            var config = await policiesResource.GetConfigurationAsync(organizationId);

            var location = config.Locations.Find(item => item.Id == locationId);
            TimeZoneInfo locationTimeZone = location?.timeZone ?? TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

            return ReferralCalculations.CalculateReferralStatus(
                policy.ReferralPolicy, referralEntry, DateTime.UtcNow, locationTimeZone);
        }
    }
}
