using CareTogether.Engines;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public class CombinedFamilyInfoFormatter
    {
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;


        public CombinedFamilyInfoFormatter(IPolicyEvaluationEngine policyEvaluationEngine)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
        }


        private async Task<VolunteerFamilyInfo> ToVolunteerFamilyInfoAsync(Guid organizationId, Guid locationId,
            VolunteerFamilyEntry entry, Family family)
        {
            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements);

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, entry.CompletedRequirements, completedIndividualRequirements);

            return new VolunteerFamilyInfo(
                entry.CompletedRequirements, entry.UploadedDocuments,
                volunteerFamilyApprovalStatus.MissingFamilyRequirements,
                volunteerFamilyApprovalStatus.AvailableFamilyApplications,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        var hasEntry = entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        var result = hasEntry
                            ? new VolunteerInfo(individualEntry!.CompletedRequirements, x.Value.MissingIndividualRequirements,
                                x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals)
                            : new VolunteerInfo(ImmutableList<CompletedRequirementInfo>.Empty, x.Value.MissingIndividualRequirements,
                                x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals);
                        return result;
                    }));
        }
    }
}
